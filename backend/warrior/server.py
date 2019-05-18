# -*- coding: utf-8 -*-

import aiohttp.web as web
import logging

from .route_table import route_table
from .database import load


async def cors_options(request):
    return web.Response(status=204)


async def cors_enable(request, response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = \
        'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = \
        'X-AC-TOKEN, Content-Type'


def run_server():
    app = web.Application()
    load()
    app.add_routes(route_table)
    app.on_response_prepare.append(cors_enable)
    a = web.route('OPTIONS', '/{h1}', cors_options)
    b = web.route('OPTIONS', '/{h1}/{h2}', cors_options)
    c = web.route('OPTIONS', '/{h1}/{h2}/{h3}', cors_options)
    d = web.route('OPTIONS', '/{h1}/{h2}/{h3}/{h4}', cors_options)
    e = web.route('OPTIONS', '/{h1}/{h2}/{h3}/{h4}/{h5}', cors_options)
    app.add_routes([a, b, c, d, e])
    logging.basicConfig(level=logging.INFO)
    web.run_app(app, host='0.0.0.0', port=59095)
