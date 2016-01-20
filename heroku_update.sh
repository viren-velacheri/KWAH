#!/bin/bash
#-----------------------------------------------------------------------
# Script to crawl animal shelter website and update list of dogs
# for kokowantsahome.
# Author: Viren Velacheri
#-----------------------------------------------------------------------
export WEB_HOST=kokowantsahome.herokuapp.com

cd webcrawl
rm -rf *.json

echo " ****************** Begin webcrawl ****************** "
#To generate json
scrapy crawl petharbor -o petharbor.json -t json
scrapy crawl austinanimalcenter -o dog_meta.json -t json
cd ..
echo " ****************** End webcrawl ****************** "

echo " ****************** Begin heroku repo update ****************** "
git add public/images/thumbs/big
git commit -a -m "crawl update"
git push
git push heroku master
echo " ****************** End heroku repo update ****************** "

echo " ****************** Begin mongo import ****************** "
#To into mongolab in heroku
mongo YOUR_HOST/YOUR_DB -u YOUR_USERNAME -p YOUR_PASSWORD --eval 'db.meta.drop();db.crawl.drop();'
mongoimport -h YOUR_HOST -d YOUR_DB -c crawl -u YOUR_USERNAME -p YOUR_PASSWORD --type json --file webcrawl/petharbor.json  --jsonArray
mongoimport -h YOUR_HOST -d YOUR_DB -c crawl -u YOUR_USERNAME -p YOUR_PASSWORD  -c meta --type json --file webcrawl/dog_meta.json  --jsonArray
echo " ****************** End mongo import ****************** "

echo " ****************** Begin update and notify ****************** "
#Run update and notify script
node update_notify.js
echo " ****************** End update and notify ****************** "

echo "************ Update pet database with kennel information ***********"
ongo YOUR_HOST/YOUR_DB -u YOUR_USERNAME -p YOUR_PASSWORD meta_update.js
echo "************ Done ************"
