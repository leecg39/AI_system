from typing import Any, AsyncIterator, Optional

import pytest

from app.services.ai_service import AIService, AIServiceError, resolve_model_name


class _Message:
    def __init__(self, content: str) -> None:
        self.content = content


class _Choice:
    def __init__(self, message: _Message) -> None:
        self.message = message


class _Usage:
    def __init__(self, prompt_tokens: int, completion_tokens: int) -> None:
        self.prompt_tokens = prompt_tokens
        self.completion_tokens = completion_tokens


class _ChatResponse:
    def __init__(self, text: str, prompt_tok: int = 10, completion_tok: int = 25) -> None:
        self.choices = [_Choice(_Message(text))]
        self.usage = _Usage(prompt_tok, completion_tok)


class _Delta:
    def __init__(self, content: Optional[str]) -> None:
        self.content = content


class _StreamChoice:
    def __init__(self, delta: _Delta) -> None:
        self.delta = delta


class _StreamChunk:
    def __init__(self, content: Optional[str]) -> None:
        self.choices = [_StreamChoice(_Delta(content))]


class _FakeStream:
    def __init__(self, chunks: list[str]) -> None:
        self._chunks = chunks

    async def __aiter__(self):
        for chunk in self._chunks:
            yield _StreamChunk(chunk)


class _FakeCompletions:
    def __init__(self) -> None:
        self.create_calls: list[dict[str, Any]] = []
        self.raise_error = False
        self._stream_mode = False

    async def create(self, **kwargs: Any) -> Any:
        self.create_calls.append(kwargs)
        if self.raise_error:
            raise RuntimeError("boom")
        if kwargs.get("stream"):
            return _FakeStream(["A", "B", "C"])
        return _ChatResponse("generated output")


class _FakeChat:
    def __init__(self) -> None:
        self.completions = _FakeCompletions()


class _FakeClient:
    def __init__(self) -> None:
        self.chat = _FakeChat()


def test_resolve_model_name_routes_supported_models() -> None:
    assert resolve_model_name("opus") == "gpt-5"
    assert resolve_model_name("sonnet") == "gpt-5"
    assert resolve_model_name("haiku") == "gpt-5"


def test_resolve_model_name_falls_back_to_default() -> None:
    assert resolve_model_name(None) == "gpt-5"
    assert resolve_model_name("unknown") == "gpt-5"


@pytest.mark.anyio
async def test_run_agent_prompt_uses_model_routing_and_returns_payload() -> None:
    fake_client = _FakeClient()
    service = AIService(client=fake_client)

    response = await service.run_agent_prompt(
        agent_name="writer",
        agent_role="content creation",
        model="haiku",
        prompt_template="You are concise.",
        task_type="blog",
        input_data={"text": "hello"},
        options={"temperature": 0.3, "max_tokens": 128},
    )

    assert response["content"] == "generated output"
    assert response["model"] == "gpt-5"
    assert response["usage"] == {"input_tokens": 10, "output_tokens": 25}

    create_call = fake_client.chat.completions.create_calls[0]
    assert create_call["model"] == "gpt-5"
    assert create_call["temperature"] == 0.3
    assert create_call["max_tokens"] == 128
    # Verify system message is first in messages list
    assert create_call["messages"][0]["role"] == "system"
    assert create_call["messages"][1]["role"] == "user"


@pytest.mark.anyio
async def test_run_agent_prompt_raises_service_error_on_client_failure() -> None:
    fake_client = _FakeClient()
    fake_client.chat.completions.raise_error = True
    service = AIService(client=fake_client)

    with pytest.raises(AIServiceError):
        await service.run_agent_prompt(
            agent_name="writer",
            agent_role="content creation",
            model="sonnet",
            prompt_template=None,
            task_type="blog",
            input_data={"text": "hello"},
        )


@pytest.mark.anyio
async def test_stream_agent_prompt_yields_chunks() -> None:
    fake_client = _FakeClient()
    service = AIService(client=fake_client)

    chunks: list[str] = []
    async for chunk in service.stream_agent_prompt(
        agent_name="writer",
        agent_role="content creation",
        model="opus",
        prompt_template=None,
        task_type="report",
        input_data={"topic": "AI"},
    ):
        chunks.append(chunk)

    assert chunks == ["A", "B", "C"]
    stream_call = fake_client.chat.completions.create_calls[0]
    assert stream_call["model"] == "gpt-5"
    assert stream_call["stream"] is True


@pytest.mark.anyio
async def test_stream_agent_prompt_raises_service_error_on_stream_failure() -> None:
    fake_client = _FakeClient()
    fake_client.chat.completions.raise_error = True
    service = AIService(client=fake_client)

    with pytest.raises(AIServiceError):
        async for _ in service.stream_agent_prompt(
            agent_name="writer",
            agent_role="content creation",
            model="sonnet",
            prompt_template=None,
            task_type="report",
            input_data={"text": "hello"},
        ):
            pass
