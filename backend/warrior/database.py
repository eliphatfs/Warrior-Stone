# -*- coding: utf-8 -*-
"""
Created on Sat May 18 12:33:23 2019

@author: eliphat
"""
import pickle
import logging

data_dict = {}


def save():
    with open("data.pick", "wb") as f:
        f.write(pickle.dumps(data_dict))


def load():
    global data_dict
    try:
        with open("data.pick", "rb") as f:
            data_dict.update(pickle.loads(f.read(-1)))
    except Exception as exc:
        logging.warn("Cannot load data file.")
        logging.traceback.print_exc()
