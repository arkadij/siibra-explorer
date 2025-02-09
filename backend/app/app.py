from pathlib import Path
import json

from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app.quickstart import router as quickstart_router
from app.sane_url import router as saneurl_router, vip_routes
from app.peek import router as peek_router
from app.config import HOST_PATHNAME, SESSION_SECRET, PATH_TO_PUBLIC
from app.dev_banner import router as devbanner_router
from app.index_html import router as index_router
from app.plugin import router as plugin_router
from app.auth import router as auth_router
from app.user import router as user_router
from app.config import HOST_PATHNAME
from app.logger import logger
from app.bkwdcompat import BkwdCompatMW
from app.version_header import VersionHeaderMW
from app.const import DOCUMENTATION_URL, INPUT_FORMAT, OUTPUT_FORMAT

app = FastAPI()

ready_flag = False

@app.get("/ready")
def ready():
    return Response(None, 204 if ready_flag else 500)


_cached_code_meta = None
@app.get("/about")
def about():
    global _cached_code_meta
    if _cached_code_meta is None:
        try:
            with open(Path(__file__).parent.parent.parent / "codemeta.json", "r") as fp:
                _cached_code_meta = json.load(fp=fp)
        except:
            ...
    if _cached_code_meta is None:
        try:
            with open(Path(PATH_TO_PUBLIC) / "codemeta.json", "r") as fp:
                _cached_code_meta = json.load(fp=fp)
        except:
            ...
    if _cached_code_meta is None:
        raise Exception(f"codemeta.json not found, cannot populate service meta")
    
    return {
        "@context": "https://gitlab.ebrains.eu/lauramble/servicemeta/-/raw/main/data/contexts/servicemeta.jsonld",
        "type": "WebApplication",
        "author": _cached_code_meta["author"],
        "dateModified": _cached_code_meta["dateModified"],
        "documentation": DOCUMENTATION_URL,
        "name": _cached_code_meta["name"],
        "version": _cached_code_meta["version"],
        "inputFormat": INPUT_FORMAT,
        "outputFormat": OUTPUT_FORMAT
    }


app.add_middleware(SessionMiddleware, secret_key=SESSION_SECRET)
app.add_middleware(BkwdCompatMW)
app.add_middleware(VersionHeaderMW)

for vip_route in vip_routes:
    @app.get(f"/{vip_route}")
    async def get_vip_route(request: Request):
        *_, vip = request.url.path.split("/")
        return RedirectResponse(f"{HOST_PATHNAME}/go/{vip}")

app.include_router(quickstart_router, prefix="/quickstart")
app.include_router(saneurl_router, prefix="/saneUrl")
app.include_router(saneurl_router, prefix="/saneurl")
app.include_router(saneurl_router, prefix="/go")
app.include_router(peek_router, prefix="/peek")
app.include_router(plugin_router, prefix="/plugins")
app.include_router(user_router, prefix="/user")

app.include_router(auth_router)
app.include_router(devbanner_router)
app.include_router(index_router)

app.mount("/.well-known", StaticFiles(directory=Path(__file__).parent / "well-known"), name="well-known")
app.mount("/", StaticFiles(directory=Path(PATH_TO_PUBLIC)), name="static")

# if HOST_PATHNAME is defined, mount on a specific route
# this may be necessary, if the reverse proxy is not under our control
# and/or we cannot easily strip the route path

if HOST_PATHNAME:
    assert HOST_PATHNAME[0] == "/", f"HOST_PATHNAME, if defined, must start with /: {HOST_PATHNAME!r}"
    assert HOST_PATHNAME[-1] != "/", f"HOST_PATHNAME, if defined, must not end with /: {HOST_PATHNAME!r}"
    logger.info(f"listening on path {HOST_PATHNAME}, also falls back to root")
    _app = app
    app = FastAPI()


    # necessary as /${HOST_PATHNAME} would result in 404
    @app.get(HOST_PATHNAME)
    def redirect():
        return RedirectResponse(f"{HOST_PATHNAME}/")

    app.mount(HOST_PATHNAME, _app)

    # fallback, also listen on root
    app.mount("", _app)

ready_flag = True

DO_NOT_LOGS = (
    "/ready",
    "/metrics",
)

import logging
class EndpointLoggingFilter(logging.Filter):
    """Custom logger filter. Do not log metrics, ready endpoint."""
    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        return all(
            message.find(do_not_log) == -1 for do_not_log in DO_NOT_LOGS
        )

logging.getLogger("uvicorn.access").addFilter(EndpointLoggingFilter())
