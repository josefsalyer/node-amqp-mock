var mockamqp = require('..'),
    amqp = require('amqp'),
    sinon = require('sinon'),
    chai = require('chai'),
    should = chai.should();
chai.use(require('sinon-chai'));

describe('amqp-mock', function(){

    describe('#publish', function(){

        it('should publish messages with different exchanges', function(done){

            var scope = mockamqp(),
                spy = sinon.spy(),
                connection = amqp.createConnection();

            scope
                .publish('exch1', 'rout', "test 1")
                .publish('exch2', 'rout', "test 2")
                ;

            connection.on('ready', function(){
                connection.exchange('exch2', {type:'fanout'}, function(exchange){
                    connection.queue('', function(queue){

                        queue.bind(exchange.name, 'rout');

                        queue.subscribe({}, function(message){
                            spy(message.data);
                        });
                    });
                });
            });

            connection.on('error', function(err){
                throw err;
            });

            setTimeout(function(){

                spy.should.have.been.calledOnce;
                spy.should.have.been.calledWith('test 2');

                scope.done();
                done();

            }, 1);
        });

        it('should publish messages with different routing keys', function(done){

            var scope = mockamqp(),
                spy = sinon.spy(),
                connection = amqp.createConnection();

            // publish 3 mock messages with different routing keys
            scope
                .publish('exch', 'rout1', "test 1")
                .publish('exch', 'rout2', "test 2")
                .publish('exch', 'rout3', "test 3")
                ;

            connection.on('ready', function(){
                connection.exchange('exch', {type:'fanout'}, function(exchange){
                    connection.queue('', function(queue){

                        // bind just to 2 routing keys.
                        queue.bind(exchange.name, 'rout3');
                        queue.bind(exchange.name, 'rout1');

                        queue.subscribe({}, function(message){
                            spy(message.data);
                        });
                    });
                });
            });

            connection.on('error', function(err){
                throw err;
            });

            setTimeout(function(){

                spy.should.have.been.calledTwice;
                spy.should.have.been.calledWith('test 1');
                spy.should.have.been.calledWith('test 3');

                scope.done();
                done();

            }, 1);
        });

    });

});
