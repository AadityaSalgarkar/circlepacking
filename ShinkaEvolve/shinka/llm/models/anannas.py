import backoff
import openai
from .pricing import ANANNAS_MODELS
from .result import QueryResult
import logging

logger = logging.getLogger(__name__)


def backoff_handler(details):
    exc = details.get("exception")
    if exc:
        logger.warning(
            f"Anannas - Retry {details['tries']} due to error: {exc}. Waiting {details['wait']:0.1f}s..."
        )


@backoff.on_exception(
    backoff.expo,
    (
        openai.APIConnectionError,
        openai.APIStatusError,
        openai.RateLimitError,
        openai.APITimeoutError,
    ),
    max_tries=20,
    max_value=20,
    on_backoff=backoff_handler,
)
def query_anannas(
    client,
    model,
    msg,
    system_msg,
    msg_history,
    output_model,
    model_posteriors=None,
    **kwargs,
) -> QueryResult:
    """Query Anannas API (OpenAI-compatible chat completions)."""
    messages = [
        {"role": "system", "content": system_msg},
        *msg_history,
        {"role": "user", "content": msg},
    ]

    if output_model is None:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            **kwargs,
        )
        content = response.choices[0].message.content
        new_msg_history = msg_history + [
            {"role": "user", "content": msg},
            {"role": "assistant", "content": content},
        ]
    else:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            response_format={"type": "json_object"},
            **kwargs,
        )
        content = response.choices[0].message.content
        new_msg_history = msg_history + [
            {"role": "user", "content": msg},
            {"role": "assistant", "content": content},
        ]

    input_cost = ANANNAS_MODELS[model]["input_price"] * response.usage.prompt_tokens
    output_cost = ANANNAS_MODELS[model]["output_price"] * response.usage.completion_tokens
    result = QueryResult(
        content=content,
        msg=msg,
        system_msg=system_msg,
        new_msg_history=new_msg_history,
        model_name=model,
        kwargs=kwargs,
        input_tokens=response.usage.prompt_tokens,
        output_tokens=response.usage.completion_tokens,
        cost=input_cost + output_cost,
        input_cost=input_cost,
        output_cost=output_cost,
        thought="",
        model_posteriors=model_posteriors,
    )
    return result
