from typing import Any, AsyncIterator

import pytest

from app.services.ai_service import AIService, AIServiceError, resolve_model_name


class _TextBlock:
    def __init__(self, text: str) -> None:
        self.type = "text"
        self.text = text


class _Usage:
    def __init__(self, input_tokens: int, output_tokens: int) -> None:
        self.input_tokens = input_tokens
        self.output_tokens = output_tokens


class _CreateResponse:
    def __init__(self, text: str, in_tokens: int = 10, out_tokens: int = 25) -> None:
        self.content = [_TextBlock(text)]
        self.usage = _Usage(in_tokens, out_tokens)


class _FakeStream:
    def __init__(self, chunks: list[str]) -> None:
        self._chunks = chunks

    async def __aenter__(self) -> "_FakeStream":
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        return None

    @property
    def text_stream(self) -> AsyncIterator[str]:
        async def _iterator() -> AsyncIterator[str]:
            for chunk in self._chunks:
                yield chunk

        return _iterator()


class _FakeMessages:
    def __init__(self) -> None:
        self.create_calls: list[dict[str, Any]] = []
        self.stream_calls: list[dict[str, Any]] = []
        self.raise_error = False

    async def create(self, **kwargs: Any) -> _CreateResponse:
        self.create_calls.append(kwargs)
        if self.raise_error:
            raise RuntimeError("boom")
        return _CreateResponse("generated output")

    def stream(self, **kwargs: Any) -> _FakeStream:
        self.stream_calls.append(kwargs)
        if self.raise_error:
            raise RuntimeError("stream boom")
        return _FakeStream(["A", "B", "C"])


class _FakeClient:
    def __init__(self) -> None:
        self.messages = _FakeMessages()


def test_resolve_model_name_routes_supported_models() -> None:
    assert resolve_model_name("opus") == "claude-3-opus-latest"
    assert resolve_model_name("sonnet") == "claude-3-5-sonnet-latest"
    assert resolve_model_name("haiku") == "claude-3-5-haiku-latest"


def test_resolve_model_name_falls_back_to_sonnet() -> None:
    assert resolve_model_name(None) == "claude-3-5-sonnet-latest"
    assert resolve_model_name("unknown") == "claude-3-5-sonnet-latest"


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
    assert response["model"] == "claude-3-5-haiku-latest"
    assert response["usage"] == {"input_tokens": 10, "output_tokens": 25}

    create_call = fake_client.messages.create_calls[0]
    assert create_call["model"] == "claude-3-5-haiku-latest"
    assert create_call["temperature"] == 0.3
    assert create_call["max_tokens"] == 128


@pytest.mark.anyio
async def test_run_agent_prompt_raises_service_error_on_client_failure() -> None:
    fake_client = _FakeClient()
    fake_client.messages.raise_error = True
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
    stream_call = fake_client.messages.stream_calls[0]
    assert stream_call["model"] == "claude-3-opus-latest"


@pytest.mark.anyio
async def test_stream_agent_prompt_raises_service_error_on_stream_failure() -> None:
    fake_client = _FakeClient()
    fake_client.messages.raise_error = True
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
