# -*- coding: utf-8 -*-
"""
Created on Sat May 18 13:04:42 2019

@author: eliphat
"""

import asyncio
import queue
import collections
import aiohttp.web as web
from .route_table import route_table


rooms = collections.defaultdict(lambda: queue.Queue())


@route_table.post("/post_message")
async def post_message(request):
    try:
        body = await request.json()
        rooms[(body["room"], body["target"])].put(body["message"])
        return web.json_response({"code": 0})
    except Exception as exc:
        return web.json_response({"code": 1, "error": repr(exc)})


@route_table.post("/fetch_message_blocked")
async def fetch_message(request):
    try:
        body = await request.json()
        while (rooms[(body["room"], body["target"])].empty()):
            await asyncio.sleep(0.05)
        return web.json_response({
                "code": 0,
                "data": rooms[(body["room"], body["target"])].get()
               })
    except Exception as exc:
        return web.json_response({"code": 1, "error": repr(exc)})
