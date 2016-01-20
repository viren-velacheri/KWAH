For image downloading

Install jpeg dev library first
  For Ubuntu
  ----------
   sudo apt-get install libjpeg-dev
  For mac
  -------
   download from http://www.ijg.org/files/jpegsrc.v7.tar.gz
   extract
   ./configure
   make
   make test
   sudo make install

sudo pip install -I Pillow

In settings.py
ITEM_PIPELINES = {
    'scrapy.contrib.pipeline.images.ImagesPipeline':1
}

IMAGES_STORE = './images'

IMAGES_EXPIRES=90

#If you want thumbnails
IMAGES_THUMBS = {
    'small':(50,50),
    'big':(270,270)
}

Other gotchas:
The spider must return a list of items
The image_urls field is a list

#To generate json
scrapy crawl petharbor -o petharbor.json -t json

#To import into mongo db
mongoimport -d scrapy -c crawl --type json --file petharbor.json  --jsonArray
Need the --jsonArray switch, since the json output is a list of objects,
otherwise you will get a BSON too large error from mongoimport

