import importlib
from collections.abc import AsyncIterator
from typing import Awaitable, Optional, Protocol, cast

from app.core.config import settings

MODEL_ROUTING: dict[str, str] = {
    "opus": "claude-3-opus-latest",
    "sonnet": "claude-3-5-sonnet-latest",
    "haiku": "claude-3-5-haiku-latest",
}


class AIServiceError(Exception):
    pass


class _MessageCreate(Protocol):
    def __call__(
        self,
        *,
        model: str,
        max_tokens: int,
        temperature: float,
        system: str,
        messages: list[dict[str, str]],
    ) -> Awaitable[object]:
        ...


class _MessageStreamContext(Protocol):
    async def __aenter__(self) -> object:
        ...

    async def __aexit__(
        self,
        exc_type: object,
        exc: object,
        tb: object,
    ) -> object:
        ...


class _MessageStream(Protocol):
    def __call__(
        self,
        *,
        model: str,
        max_tokens: int,
        temperature: float,
        system: str,
        messages: list[dict[str, str]],
    ) -> _MessageStreamContext:
        ...


def resolve_model_name(model: Optional[str]) -> str:
    if model is None:
        return MODEL_ROUTING["sonnet"]
    return MODEL_ROUTING.get(model.lower(), MODEL_ROUTING["sonnet"])


def _normalize_input(input_data: dict[str, object]) -> str:
    if "text" in input_data and isinstance(input_data["text"], str):
        return input_data["text"]
    if "url" in input_data and isinstance(input_data["url"], str):
        return f"Analyze this URL: {input_data['url']}"
    if "topic" in input_data and isinstance(input_data["topic"], str):
        return f"Create content about: {input_data['topic']}"
    return str(input_data)


def _extract_text_content(response: object) -> str:
    blocks = getattr(response, "content", [])
    if not isinstance(blocks, list):
        return str(blocks)

    texts: list[str] = []
    for block in blocks:
        if isinstance(block, dict):
            if block.get("type") == "text" and isinstance(block.get("text"), str):
                texts.append(block["text"])
            continue

        block_type = getattr(block, "type", None)
        block_text = getattr(block, "text", None)
        if block_type == "text" and isinstance(block_text, str):
            texts.append(block_text)

    return "\n".join(texts).strip()


def _coerce_int(value: object, default: int) -> int:
    if isinstance(value, bool):
        return default
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    if isinstance(value, str):
        try:
            return int(value)
        except ValueError:
            return default
    return default


def _coerce_float(value: object, default: float) -> float:
    if isinstance(value, bool):
        return default
    if isinstance(value, int):
        return float(value)
    if isinstance(value, float):
        return value
    if isinstance(value, str):
        try:
            return float(value)
        except ValueError:
            return default
    return default


class AIService:
    def __init__(
        self,
        api_key: Optional[str] = None,
        client: Optional[object] = None,
    ) -> None:
        resolved_key = api_key if api_key is not None else settings.ANTHROPIC_API_KEY
        self._client = client
        self._api_key = resolved_key

    @property
    def client(self) -> object:
        if self._client is not None:
            return self._client

        if not self._api_key:
            raise AIServiceError("ANTHROPIC_API_KEY is not configured")

        module = importlib.import_module("anthropic")
        client_class = getattr(module, "AsyncAnthropic", None)
        if client_class is None:
            raise AIServiceError("anthropic.AsyncAnthropic is unavailable")

        self._client = client_class(api_key=self._api_key)
        return self._client

    async def run_agent_prompt(
        self,
        agent_name: str,
        agent_role: str,
        model: Optional[str],
        prompt_template: Optional[str],
        task_type: str,
        input_data: dict[str, object],
        options: Optional[dict[str, object]] = None,
    ) -> dict[str, object]:
        resolved_model = resolve_model_name(model)
        merged_options = options or {}
        user_text = _normalize_input(input_data)
        system_prompt = (prompt_template or "").strip() or (
            f"You are {agent_name}. Your role is {agent_role}. "
            f"Produce a high-quality {task_type} output."
        )

        max_tokens = _coerce_int(merged_options.get("max_tokens", 2048), 2048)
        temperature = _coerce_float(merged_options.get("temperature", 0.2), 0.2)

        try:
            messages = getattr(self.client, "messages", None)
            if messages is None:
                raise AIServiceError("Anthropic client does not expose messages API")

            create_method = cast(_MessageCreate, getattr(messages, "create", None))
            if not callable(create_method):
                raise AIServiceError("Anthropic client does not expose messages.create")

            response = await create_method(
                model=resolved_model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt,
                messages=[{"role": "user", "content": user_text}],
            )
        except Exception as exc:
            raise AIServiceError(f"Claude request failed: {exc}") from exc

        content = _extract_text_content(response)
        usage = getattr(response, "usage", None)
        input_tokens = getattr(usage, "input_tokens", 0) if usage is not None else 0
        output_tokens = getattr(usage, "output_tokens", 0) if usage is not None else 0

        return {
            "content": content,
            "model": resolved_model,
            "usage": {
                "input_tokens": _coerce_int(input_tokens, 0),
                "output_tokens": _coerce_int(output_tokens, 0),
            },
        }

    async def stream_agent_prompt(
        self,
        agent_name: str,
        agent_role: str,
        model: Optional[str],
        prompt_template: Optional[str],
        task_type: str,
        input_data: dict[str, object],
        options: Optional[dict[str, object]] = None,
    ) -> AsyncIterator[str]:
        resolved_model = resolve_model_name(model)
        merged_options = options or {}
        user_text = _normalize_input(input_data)
        system_prompt = (prompt_template or "").strip() or (
            f"You are {agent_name}. Your role is {agent_role}. "
            f"Produce a high-quality {task_type} output."
        )

        max_tokens = _coerce_int(merged_options.get("max_tokens", 2048), 2048)
        temperature = _coerce_float(merged_options.get("temperature", 0.2), 0.2)

        try:
            messages = getattr(self.client, "messages", None)
            if messages is None:
                raise AIServiceError("Anthropic client does not expose messages API")

            stream_method = cast(_MessageStream, getattr(messages, "stream", None))
            if not callable(stream_method):
                raise AIServiceError("Anthropic client does not expose messages.stream")

            stream_context = stream_method(
                model=resolved_model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_prompt,
                messages=[{"role": "user", "content": user_text}],
            )

            async with stream_context as stream:
                text_stream = getattr(stream, "text_stream", None)
                if text_stream is None:
                    raise AIServiceError("Claude stream response does not expose text_stream")

                async for text in text_stream:
                    if isinstance(text, str):
                        yield text
                    else:
                        yield str(text)
        except Exception as exc:
            raise AIServiceError(f"Claude stream failed: {exc}") from exc
