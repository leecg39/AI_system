import importlib
from collections.abc import AsyncIterator
from typing import Optional

from app.core.config import settings

MODEL_ROUTING: dict[str, str] = {
    "opus": "gpt-4o",
    "sonnet": "gpt-4o",
    "haiku": "gpt-4o-mini",
}


class AIServiceError(Exception):
    pass


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
        resolved_key = api_key if api_key is not None else settings.OPENAI_API_KEY
        self._client = client
        self._api_key = resolved_key

    @property
    def client(self) -> object:
        if self._client is not None:
            return self._client

        if not self._api_key:
            raise AIServiceError("OPENAI_API_KEY is not configured")

        module = importlib.import_module("openai")
        client_class = getattr(module, "AsyncOpenAI", None)
        if client_class is None:
            raise AIServiceError("openai.AsyncOpenAI is unavailable")

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
            chat = getattr(self.client, "chat", None)
            if chat is None:
                raise AIServiceError("OpenAI client does not expose chat API")

            completions = getattr(chat, "completions", None)
            if completions is None:
                raise AIServiceError("OpenAI client does not expose chat.completions")

            create_method = getattr(completions, "create", None)
            if not callable(create_method):
                raise AIServiceError("OpenAI client does not expose chat.completions.create")

            response = await create_method(
                model=resolved_model,
                max_tokens=max_tokens,
                temperature=temperature,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_text},
                ],
            )
        except AIServiceError:
            raise
        except Exception as exc:
            raise AIServiceError(f"OpenAI request failed: {exc}") from exc

        choices = getattr(response, "choices", [])
        if choices:
            message = getattr(choices[0], "message", None)
            content = getattr(message, "content", "") if message else ""
        else:
            content = ""

        usage = getattr(response, "usage", None)
        prompt_tokens = getattr(usage, "prompt_tokens", 0) if usage is not None else 0
        completion_tokens = getattr(usage, "completion_tokens", 0) if usage is not None else 0

        return {
            "content": content or "",
            "model": resolved_model,
            "usage": {
                "input_tokens": _coerce_int(prompt_tokens, 0),
                "output_tokens": _coerce_int(completion_tokens, 0),
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
            chat = getattr(self.client, "chat", None)
            if chat is None:
                raise AIServiceError("OpenAI client does not expose chat API")

            completions = getattr(chat, "completions", None)
            if completions is None:
                raise AIServiceError("OpenAI client does not expose chat.completions")

            create_method = getattr(completions, "create", None)
            if not callable(create_method):
                raise AIServiceError("OpenAI client does not expose chat.completions.create")

            stream = await create_method(
                model=resolved_model,
                max_tokens=max_tokens,
                temperature=temperature,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_text},
                ],
                stream=True,
            )

            async for chunk in stream:
                choices = getattr(chunk, "choices", [])
                if choices:
                    delta = getattr(choices[0], "delta", None)
                    text = getattr(delta, "content", None) if delta else None
                    if text:
                        yield text
        except AIServiceError:
            raise
        except Exception as exc:
            raise AIServiceError(f"OpenAI stream failed: {exc}") from exc
