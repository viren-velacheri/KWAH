# -*- coding: utf-8 -*-

# Define here the models for your scraped items
#
# See documentation in:
# http://doc.scrapy.org/en/latest/topics/items.html

import scrapy

class PetharborItem(scrapy.Item):
    # define the fields for your item here like:
    # name = scrapy.Field()
    name = scrapy.Field()
    id = scrapy.Field()
    gender_detail = scrapy.Field()
    gender = scrapy.Field()
    fixed = scrapy.Field()
    color = scrapy.Field()
    breed = scrapy.Field()
    ageyears = scrapy.Field()
    agemonths = scrapy.Field()
    agedays = scrapy.Field()
    date_string = scrapy.Field()
    location = scrapy.Field()
    image_urls = scrapy.Field()
    images = scrapy.Field()
    search_text=scrapy.Field()
    age=scrapy.Field()
    details=scrapy.Field()
    location_address=scrapy.Field()
    location_phone=scrapy.Field()
    location_email=scrapy.Field()
    location_info=scrapy.Field()

class AustinAnimalCenterItem(scrapy.Item):
    id = scrapy.Field()
    size = scrapy.Field()
    kennel = scrapy.Field()
    size = scrapy.Field()
