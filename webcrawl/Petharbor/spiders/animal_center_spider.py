import scrapy
import re

from Petharbor.items import AustinAnimalCenterItem

class AnimalCenterSpider(scrapy.Spider):
    name="austinanimalcenter"
    allowed_domains = ["petharbor.com"]
    #start_urls = ["http://www.petharbor.com/results.asp?searchtype=ADOPT&stylesheet=include/default.css&frontdoor=1&grid=1&friends=1&samaritans=1&nosuccess=0&rows=5000&imght=120&imgres=thumb&tWidth=200&view=sysadm.v_animal&fontface=arial&fontsize=10&miles=20&lat=30.300474&lon=-97.747247&shelterlist='ASTN','90343','72312','73748','73064','63250','78098','72699','78456','78552','79815','80971','88570','86145','75304','78347','83335','85034','71872','76816','82004','89469','73793','87542','69562','87125','84976','86555','73895','85366','82718','79604','78842','77070','69865','86866'&atype=dog&ADDR=undefined&nav=1&start=4&nomax=1&page=1&where=type_DOG"]

    #From austin animal center in table format with kennel number
    start_urls= ["http://www.petharbor.com/results.asp?searchtype=ADOPT&friends=1&samaritans=1&nosuccess=0&rows=1000&imght=120&imgres=thumb&tWidth=200&view=sysadm.v_austin&nobreedreq=1&bgcolor=ffffff&text=29abe2&link=024562&alink=017db3&vlink=017db3&fontface=arial&fontsize=10&col_hdr_bg=29abe2&col_hdr_fg=29abe2&col_fg=29abe2&SBG=ffffff&zip=78704&miles=10&shelterlist=%27ASTN%27&atype=&where=type_DOG,size_s&PAGE=1",
    "http://www.petharbor.com/results.asp?searchtype=ADOPT&friends=1&samaritans=1&nosuccess=0&rows=1000&imght=120&imgres=thumb&tWidth=200&view=sysadm.v_austin&nobreedreq=1&bgcolor=ffffff&text=29abe2&link=024562&alink=017db3&vlink=017db3&fontface=arial&fontsize=10&col_hdr_bg=29abe2&col_hdr_fg=29abe2&col_fg=29abe2&SBG=ffffff&zip=78704&miles=10&shelterlist=%27ASTN%27&atype=&where=type_DOG,size_m&PAGE=1",
    "http://www.petharbor.com/results.asp?searchtype=ADOPT&friends=1&samaritans=1&nosuccess=0&rows=1000&imght=120&imgres=thumb&tWidth=200&view=sysadm.v_austin&nobreedreq=1&bgcolor=ffffff&text=29abe2&link=024562&alink=017db3&vlink=017db3&fontface=arial&fontsize=10&col_hdr_bg=29abe2&col_hdr_fg=29abe2&col_fg=29abe2&SBG=ffffff&zip=78704&miles=10&shelterlist=%27ASTN%27&atype=&where=type_DOG,size_l&PAGE=1"]

    def parse(self,response):
        #with open("petharbor-scrape.txt","wb") as f:
        #    f.write(response.body)
        #items=[]
        sizes = ['size_s','size_m','size_l']
        size_map = { 'size_s' : 'small' , 'size_m' : 'medium' , 'size_l':'large'}
        for sel in response.css('.ResultsTable').css('tr'):
            item = AustinAnimalCenterItem()

            id = sel.css('td:nth-child(2)').xpath('text()').extract()
            if len(id):
                item["id"] = id[0]
            else:
                continue

            kennel = sel.css('td:nth-child(5)').xpath('text()').extract()
            if len(kennel):
                item["kennel"] = kennel[0]

            for size in sizes:
                p = re.compile(size);
                m = p.search(response.url)

                if m is not None:
                    item["size"] = size_map[size]
                    break    

            yield(item)


