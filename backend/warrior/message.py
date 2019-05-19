# -*- coding: utf-8 -*-
"""
Created on Sat May 18 13:04:42 2019

@author: eliphat
"""

import asyncio
import queue
import collections
import aiohttp.web as web
import logging
from .route_table import route_table


rooms = collections.defaultdict(lambda: queue.deque())


@route_table.post("/post_message")
async def post_message(request):
    try:
        body = await request.json()
        rooms[(body["room"], body["target"])].append(body["message"])
        return web.json_response({"code": 0})
    except Exception as exc:
        return web.json_response({"code": 1, "error": repr(exc)})


@route_table.post("/fetch_message_blocked")
async def fetch_message(request):
    try:
        body = await request.json()
        while (rooms[(body["room"], body["target"])].empty()):
            await asyncio.sleep(0.05)
        logging.info("GET: " + str(body["room"]) + str(body["target"]))
        msg = rooms[(body["room"], body["target"])].popleft()
        rooms[(body["room"], body["target"])].appendleft(msg)
        return web.json_response({
                "code": 0,
                "data": msg
               })
    except Exception as exc:
        return web.json_response({"code": 1, "error": repr(exc)})


@route_table.post("/acknowledge_message")
async def ack_message(request):
    try:
        body = await request.json()
        logging.info("ACK: " + str(body["room"]) + str(body["target"]))
        rooms[(body["room"], body["target"])].popleft()
        return web.json_response({
                "code": 0
               })
    except Exception as exc:
        return web.json_response({"code": 1, "error": repr(exc)})
