# -*- coding: utf-8 -*-
{
    'name': "Multi Tabs",
    'description': """
        Multi Tabs
    """,
    'version': '0.1',
    'depends': ['base','web'],
    "installable": True,
    "auto_install": False,
    "assets": {
        "web.assets_backend": [
           "k8_tabbar/static/src/**/*",
        ],
    },
    "images": [
        'static/description/image.jpg'
    ]
            
}
