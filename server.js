import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const port=4173;
const files={
  '/':'index.html',
  '/index.html':'index.html',
  '/styles.css':'styles.css',
  '/script.js':'script.js'
};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};

http.createServer(function(request,response){
  const pathname=new URL(request.url,'http://localhost').pathname;
  const filename=files[pathname];
  if(!filename){response.writeHead(404);response.end('Not found');return}
  const filepath=path.join(root,filename);
  fs.readFile(filepath,function(error,data){
    if(error){response.writeHead(500);response.end('Server error');return}
    response.writeHead(200,{'Content-Type':types[path.extname(filepath)]||'application/octet-stream','Cache-Control':'no-store'});
    response.end(data);
  });
}).listen(port,'127.0.0.1',function(){
  console.log('SurveyFlow demo: http://localhost:'+port);
});
