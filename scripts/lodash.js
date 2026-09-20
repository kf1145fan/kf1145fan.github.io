const _ = require('lodash');

hexo.extend.filter.register('template_locals', function(locals) {
  locals._ = _;
  return locals;
});
