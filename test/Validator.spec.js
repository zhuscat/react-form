const expect = require('chai').expect;
const Validator = require('../src/Validator').default;

describe('Validator', function() {
  it('validate', function(done) {
    const validator = new Validator({
      'username': [
        {
          validator: (value, formdata, callback) => {
            setTimeout(callback(new Error('不合法的输入')), 1000);
          },
        },
        {
          validator: (value, formdata, callback) => {
            setTimeout(callback(new Error('再次的不合法输入')), 1000);
          },
        },
      ],
      'password': [
        {
          validator: (value, formdata, callback) => {
            setTimeout(callback(new Error('不合法的密码')), 1500);
          },
        },
      ],
    });
    validator.validate({
      username: 'abc',
      password: 'abc',
    }, function(errMap) {
      done();
    });
  });
});
