function handler(event) {
  var request = event.request;
  var uri = request.uri.replace(/\\/g, '/').replace(/^\/+/, '/');
  request.uri = uri;
  var host = request.headers && request.headers.host && request.headers.host.value;
  var canonical = {'matt-jones.org':'mattjonesllc.com','www.matt-jones.org':'mattjonesllc.com','www.mattjonesllc.com':'mattjonesllc.com','www.coolmatt.games':'coolmatt.games','coolmattgames.io':'coolmatt.games','www.coolmattgames.io':'coolmatt.games'};
  if (canonical[host]) {
    var query = [];
    Object.keys(request.querystring || {}).forEach(function(k) {
      var item = request.querystring[k];
      (item.multiValue || [item]).forEach(function(v) { query.push(k + '=' + v.value); });
    });
    return {statusCode:302,statusDescription:'Found',headers:{location:{value:'https://' + canonical[host] + uri + (query.length ? '?' + query.join('&') : '')}}};
  }
  if (uri.endsWith('/')) request.uri += 'index.html';
  else if (uri.split('/').pop().indexOf('.') === -1) {
    var parts = [];
    var qs = request.querystring || {};
    Object.keys(qs).forEach(function(k) {
      var vals = qs[k].multiValue || [qs[k]];
      vals.forEach(function(v) { parts.push(k + '=' + v.value); });
    });
    return {statusCode: 301, statusDescription: 'Moved Permanently', headers: {location: {value: uri + '/' + (parts.length ? '?' + parts.join('&') : '')}}};
  }
  return request;
}
