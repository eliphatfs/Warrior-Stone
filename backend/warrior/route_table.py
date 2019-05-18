# -*- coding: utf-8 -*-

import aiohttp.web


class _routeTableDef(aiohttp.web.RouteTableDef):
    """
    Function
    --------------
    | The route table for route registration.

    Notes
    --------------
    | After creating a new source file,
      don't forget to add it to *__init__.py*!

    Example
    --------------
    .. code-block:: python
        :emphasize-lines: 1

        @route_table.get("/hello")
        async def hello_page(req):
            return web.Response(text="Hello, world")
    """


route_table = _routeTableDef()
