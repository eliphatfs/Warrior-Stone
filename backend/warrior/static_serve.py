# -*- coding: utf-8 -*-
"""
Created on Sat May 18 12:25:46 2019

@author: eliphat
"""
import aiohttp.web as web
import zipfile
from .route_table import route_table


def ensure_load_static(app):
    if "warrior_assets" in app:
        return
    app["warrior_assets"] = dict()
    with zipfile.ZipFile("static_assets.zip") as zf:
        for name in zf.namelist():
            app["warrior_assets"][name] = zf.read(name).decode()


@route_table.get("/warrior/{src}")
async def hierachy_root(request):
    ensure_load_static(request.app)
    src = request.match_info["src"]
    return web.Response(text=request.app["warrior_assets"][src], content_type="text/html")


@route_table.get("/warrior/{s1}/{s2}")
async def hierachy_sub_2(request):
    ensure_load_static(request.app)
    s1 = request.match_info["s1"]
    s2 = request.match_info["s2"]
    src = s1 + "/" + s2
    return web.Response(text=request.app["warrior_assets"][src], content_type="text/html")


@route_table.get("/warrior")
@route_table.get("/warrior/")
async def hierachy_redir(request):
    return web.HTTPFound("/warrior/index.html")
