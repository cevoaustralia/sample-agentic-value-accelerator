FROM public.ecr.aws/docker/library/python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    CLAUDE_CODE_USE_BEDROCK=1 \
    DISABLE_TELEMETRY=1 \
    DISABLE_ERROR_REPORTING=1 \
    DISABLE_AUTOUPDATER=1 \
    UV_INSTALL_DIR=/usr/local/bin \
    HOME=/home/runner \
    PATH=/usr/local/bin:/usr/local/lib/node_modules/.bin:$PATH

WORKDIR /app

# System deps + Node 20 (Claude Code CLI) + uv (uvx-based MCP servers).
# Everything installed system-wide so the non-root runner user can use it.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl git xz-utils \
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && npm install -g @anthropic-ai/claude-code \
 && curl -LsSf https://astral.sh/uv/install.sh | sh \
 && rm -rf /var/lib/apt/lists/* \
 && useradd --create-home --home-dir /home/runner --shell /bin/bash runner \
 && mkdir -p /home/runner/.cache /home/runner/.config \
 && chown -R runner:runner /home/runner

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Bake the full service-onboarding plugin (commands/, .claude-plugin/, .mcp.json,
# skills/, rules/, schemas/, tools/, data/). The runner runs `claude` from a
# scratch workdir that symlinks this plugin in so the orchestrator command and
# all 21 skills are discoverable.
COPY --chown=runner:runner plugin/ /opt/service-approval-plugin/

COPY --chown=runner:runner entrypoint.py /app/entrypoint.py

# Claude Code CLI refuses to run as root. Drop to the runner user.
USER runner
ENTRYPOINT ["python", "/app/entrypoint.py"]
