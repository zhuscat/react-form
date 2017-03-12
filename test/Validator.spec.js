const expect = require('chai').expect;
const Validator = require('../src/Validator').default;
const { validateStrategy } = require('../src/Validator');

describe('Validator', function() {
  it('validate strategy:once', function(done) {
    const once = validateStrategy.once;
    const testFunc = function(data, callback) {
      setTimeout(() => {
        if (data.value === 5) {
          callback('one error');
        } else {
          callback();
        }
      }, 100);
    };
    const arr = [
      {
        value: 1,
      },
      {
        value: 2,
      },
      {
        value: 3,
      },
      {
        value: 4,
      },
      {
        value: 5,
      },
      {
        value: 6,
      },
    ]
    once(testFunc, arr).then(value => {
      expect(value).to.equal('one error');
      done();
    });
  });

  it('validate strategy:all', function(done) {
    const all = validateStrategy.all;
    const testFunc = function(data, callback) {
      setTimeout(() => {
        callback(data.value);
      }, 10);
    };
    const arr = [
      {
        value: 1,
      },
      {
        value: 2,
      },
      {
        value: 3,
      },
      {
        value: 4,
      },
      {
        value: 5,
      },
      {
        value: 6,
      },
    ]
    all(testFunc, arr).then(value => {
      expect(value).to.deep.equal([1, 2, 3, 4, 5, 6]);
      done();
    });
  });

  it('validate', function(done) {
    const validator = new Validator({
      'username': [
        {
          required: true,
        },
        {
          validator: (value, rule, formdata, callback) => {
            setTimeout(callback(new Error('不合法的输入')), 1000);
          },
        },
        {
          validator: (value, rule, formdata, callback) => {
            setTimeout(callback(new Error('再次的不合法输入')), 1000);
          },
        },
      ],
      'password': [
        {
          validator: (value, rule, formdata, callback) => {
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
