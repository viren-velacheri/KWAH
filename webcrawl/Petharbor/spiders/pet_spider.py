import scrapy
import re

from Petharbor.items import PetharborItem

class PetharborSpider(scrapy.Spider):
    name="petharbor"
    allowed_domains = ["petharbor.com"]
    #start_urls = ["http://www.petharbor.com/results.asp?searchtype=ADOPT&stylesheet=include/default.css&frontdoor=1&grid=1&friends=1&samaritans=1&nosuccess=0&rows=5000&imght=120&imgres=thumb&tWidth=200&view=sysadm.v_animal&fontface=arial&fontsize=10&miles=20&lat=30.300474&lon=-97.747247&shelterlist='ASTN','90343','72312','73748','73064','63250','78098','72699','78456','78552','79815','80971','88570','86145','75304','78347','83335','85034','71872','76816','82004','89469','73793','87542','69562','87125','84976','86555','73895','85366','82718','79604','78842','77070','69865','86866'&atype=dog&ADDR=undefined&nav=1&start=4&nomax=1&page=1&where=type_DOG"]

    #From austin animal center in table format with kennel number
    #start_urls= ["http://www.petharbor.com/results.asp?searchtype=ADOPT&friends=1&samaritans=1&nosuccess=0&rows=1000&imght=120&imgres=thumb&tWidth=200&view=sysadm.v_austin&nobreedreq=1&bgcolor=ffffff&text=29abe2&link=024562&alink=017db3&vlink=017db3&fontface=arial&fontsize=10&col_hdr_bg=29abe2&col_hdr_fg=29abe2&col_fg=29abe2&SBG=ffffff&zip=78704&miles=10&shelterlist=%27ASTN%27&atype=&where=type_DOG&PAGE=1"]

    start_urls = ['http://www.petharbor.com/results.asp?searchtype=ADOPT&frontdoor=1&grid=1&friends=1&samaritans=1&nosuccess=0&rows=1000&imght=120&imgres=thumb&tWidth=200&view=sysadm.v_animal&fontface=arial&fontsize=10&zip=78733&miles=20&shelterlist=%27ASTN%27&atype=dog&ADDR=undefined&nav=1&start=4&nomax=1&page=1&where=type_DOG']
    
    def parse(self,response):
        #with open("petharbor-scrape.txt","wb") as f:
        #    f.write(response.body)
        #items=[]
        for sel in response.xpath('//div[@class="gridResult"]'):
            item = PetharborItem()

            #To search for a keyword amongst any field
            #create a list of all field values
            search_text_fields=[]

            field = sel.xpath('div/text()').extract()
            p = re.compile('(^.+)\s\((\w+)\)')
            m = p.search(field[0])
            if m is None:
                item["name"] = "" 
                item["id"] = field[0]
            else:
                item["name"]= m.group(1)
                item["id"]=m.group(2)
                search_text_fields.append(item["name"].lower())
            search_text_fields.append(item["id"].lower())
            
            p = re.compile('(^\w+)\s\((\w+)\)$')
            m = p.search(field[1])
            item["gender_detail"]=field[1]
            if m is None:
                item["gender"] = field[1]
                item["fixed"] = False
            else:
                item["gender"]= m.group(1)
                item["fixed"]=True
                #This is to cover both neutered and spayed
                search_text_fields.append("fixed")
            #search_text_fields.append(item["gender"].lower())
            search_text_fields.append(item["gender_detail"].lower())

            item["breed"]=field[3]
            search_text_fields.append(item["breed"].lower())

            p = re.compile('(^[0-9]+)\sYears$')
            m = p.search(field[4])
            if m is not None:
                item["ageyears"]=int(m.group(1))
                #Alias age to age in years
                item["age"]=item["ageyears"]
            #Don't add age to search_text_fields

            p = re.compile('(^[0-9]+)\sMonths$')
            m = p.search(field[5])
            if m is not None:
                item["agemonths"]=int(m.group(1))

            p = re.compile('(^[0-9]+)\sDays$')
            m = p.search(field[6])
            if m is not None:
                item["agedays"]=int(m.group(1))

            item["date_string"]=field[7]
            item["location"]=field[8]
            search_text_fields.append(item["location"].lower())

            item["search_text"]=search_text_fields
            #image_urls has to be a list
            item['image_urls'] = ['http://petharbor.com/' + sel.xpath('a/img/@src').extract()[0]]
            #items.append(item)
            #yield(item)
            #print item['breed']
        #return items
            url_detail = 'http://www.petharbor.com/' + sel.xpath('a/@href').extract()[0]
            print url_detail
            request = scrapy.Request(url_detail,callback=self.parse_details)
            request.meta['item'] = item
            yield(request)

    def parse_details(self, response):
        item = response.meta['item']
        #item['details'] = response.xpath('//table[@class="DetailTable"]/tr/td[@class="DetailDesc"]/text()').extract()
        item['details'] = response.xpath('//table[@class="DetailTable"]').extract()
        return item
#url_detail = 'http://www.petharbor.com/' + response.xpath('//table[@class="DetailTable"]/tr/td[@div][@align="center"]/a/@href').extract()[0]
 #       print url_detail
  #      request = scrapy.Request(url_detail,callback=self.parse_location_details)
   #     request.meta['item'] = item
    #    return request

    def parse_location_details(self,response):
        item = response.meta['item']
    
        item['location_address'] = response.xpath('//div[@class="contact cC"]/text()').extract()
        item['location_phone']   = response.xpath('//div[@class="contact cL"]/text()').extract()
        item['location_email']   = response.xpath('//div[@class="contact cJ cST"]/a/@href').extract()
        item['location_info']   = response.xpath('//div[@class="contact cJ cST"]/text()').extract()

        return item
