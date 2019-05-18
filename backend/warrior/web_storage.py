# -*- coding: utf-8 -*-
"""
Created on Sat May 18 12:25:46 2019

@author: eliphat
"""
import aiohttp.web as web
from .route_table import route_table
from .database import data_dict, save


@route_table.post("/store_deck")
async def store_deck(request):
    try:
        body = await request.json()
        data_dict[body["name"]] = body["content"]
        save()
        return web.json_response({"code": 0})
    except Exception as exc:
        return web.json_response({"code": 1, "error": repr(exc)})


@route_table.post("/load_deck")
async def load_deck(request):
    try:
        body = await request.json()
        return web.json_response({"code": 0, "data": data_dict[body["name"]]})
    except Exception as exc:
        return web.json_response({"code": 1, "error": repr(exc)})
