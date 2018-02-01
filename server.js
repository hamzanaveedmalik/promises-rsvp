var RSVP = require("rsvp");
var http = require('http');
var fs = require('fs');
var path = require('path');
var request = require("request");
var cheerio = require("cheerio");
var queryString = require('querystring');
var url = require('url');
var jsdom = require("jsdom");

const port = process.env.PORT || 3000;
var titles=[];


var server = http.createServer( (req, res) => {

    if (req.method === 'GET'){

        var getQueryParams = () => {

        var promise = new RSVP.Promise((resolve, reject) =>

        {
            var queryString = url.parse(req.url, true).query;
            console.log(queryString);
            if(!queryString.address)
            {
                res.end('<h1>Error 404</h1>');
                reject('<h1>Error 404: ' + req.url +' should not be empty</h1>');
                return;
            }
                resolve(queryString);
        });
        return promise;
        };

        var getTitles = (queryString) => {

        var promise = new RSVP.Promise((resolve, reject) =>
        {
            var count=Object.keys(queryString.address).length;
              if(typeof queryString.address ==='string')
              {
                count=1;
              }

            if(count>1)
            {
                queryString.address.forEach((element) => {
                request(element, (error, response, body) =>
                 {          if(error)
                        {
                            titles.push(error.message);
                            if(titles.length==count)
                                    resolve(titles);
                        }
                        else{
                            var $ = cheerio.load(body);
                            var title = $("title");
                            console.log(title.html());
                            titles.push(title.html());

                            if(titles.length==count)
                                resolve(titles);
                        }
                    })
                }, this);
              }
                    else {
                        console.log(queryString.address);
                        request(queryString.address, (error, response, body) => {
                                if(error){
                                    titles.push(error.message);
                                    if(titles.length==count)
                                        resolve(titles);

                                    }
                                else{
                                    var $ = cheerio.load(body);
                                    var title = $("title");
                                    console.log(title.html());
                                    titles.push(title.html());
                                    if(titles.length==count)
                                        resolve(titles);
                                }
                            })
                    }
        });
        return promise;
        };

        var renderHtml = (titles) => {

          var promise = new RSVP.Promise((resolve, reject) => {
            console.log(titles);
            fs.readFile('./views.html', 'utf8', (error, data) =>
             {
                if(error){
                    reject("Error with reading index"+error);
                }


                jsdom.env(data, [],  (errors, window) => {
                    var $ = require('jquery')(window);
                    for(var i=0;i<titles.length;i++)
                        $("ul").append('<li>'+titles[i]+'</li>');

                resolve(window.document.documentElement.outerHTML);
                });

             });

        });
        return promise;
        };

        getQueryParams(req.url).then((queryString) => {
            return getTitles(queryString);
          }).then((titles) => {
                    return renderHtml(titles);
                  }).then((renderHtmlvalue)=>{
                            res.writeHeader(200, {"Content-Type": "text/html"});
                            res.write(renderHtmlvalue);
                            res.end();
                }).catch((error) => {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(`Error occured with promise ${error.message}`);

           });

    }
      else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>Error 404: ' + req.method +' not supported</h1>');
      }
    })

server.listen(port, () => {
  console.log(`Server is up at port: ${port}`);
});
