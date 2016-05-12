/**
TEST_TRICKMODE:

- load test page
- for each stream:
    - load stream
    - get stream duration (OrangeHasPlayer.getDuration())
    - repeat N times:
        - seek at a random position (OrangeHasPlayer.seek())
        - check if <video> is playing at new position
        - check if <video> is progressing
**/
define([
    'intern!object',
    'intern/chai!assert',
    'require',
    'testIntern/config/testsConfig',
    'testIntern/tests/player_functions',
    'testIntern/tests/video_functions',
    'testIntern/tests/tests_functions'
    ], function(registerSuite, assert, require, config, player, video, tests) {

        // Suite name
        var NAME = 'TEST_TRICKMODE';

        // Test configuration (see config/testConfig.js)
        var testConfig = config.tests.play.trickMode,
            streams = testConfig.streams;

        // Test constants
        var PROGRESS_DELAY = 2; // Delay for checking progressing (in s) 
        var ASYNC_TIMEOUT = PROGRESS_DELAY + config.asyncTimeout;

        // Test variables
        var command = null,
            streamDuration = 0,
            speedValues = [-128,-64,-32,-16,-8,-4,-2,2,4,8,16,32,64,128],
            tolerance = 0.1,
            i, j;

        var testSetup = function (stream) {
            registerSuite({
                name: NAME,

                setup: function() {
                    tests.log(NAME, 'Setup');
                    command = this.remote.get(require.toUrl(config.testPage));
                    command = tests.setup(command);
                    return command;
                },

                play: function() {
                    tests.logLoadStream(NAME, stream);
                    return command.execute(player.loadStream, [stream])
                    .then(function () {
                        tests.log(NAME, 'Check if playing after ' + PROGRESS_DELAY + 's.');
                        return tests.executeAsync(command, video.isPlaying, [PROGRESS_DELAY], ASYNC_TIMEOUT);
                    })
                    .then(function(playing) {
                        assert.isTrue(playing);
                        return command.execute(player.getDuration);
                    })
                    .then(function (duration) {
                        streamDuration = duration;
                        tests.log(NAME, 'Duration: ' + duration);
                    });
                }
            });
        };

        var test = function (speed, isMuteBeforeTrick) {

            registerSuite({
                name: NAME,

                seek: function () {
                    var interval = (Math.random() * 5) + 10, // between 10 and 15
                        seekValue = speed < 0 ? (streamDuration - interval) : interval;

                    tests.log(NAME, 'Seek at time ' + seekValue);
                    return tests.executeAsync(command, player.seek, [seekValue], config.asyncTimeout)
                    .then(function () { 
                        tests.log(NAME, 'Check if playing after ' + PROGRESS_DELAY + 's.');
                        return tests.executeAsync(command, video.isPlaying, [PROGRESS_DELAY], ASYNC_TIMEOUT)
                        .then(function (playing) {
                            assert.isTrue(playing);
                            tests.log(NAME, 'before trick test, mute = '+ isMuteBeforeTrick);
                            return command.execute(player.setMute,[isMuteBeforeTrick]);
                        });
                    });
                },

                trickMode: function () {
                    var videoTimeBeforeTrickMode,
                        timeBeforeTrickMode,
                        videoTimeAfterTrickMode,
                        timeAfterTrickMode,
                        sleepDuration = (Math.random() * 5) + 10; // between 10 and 15
                    
                    return command.execute(video.getCurrentTime)
                    .then(function (time) {
                        videoTimeBeforeTrickMode = time;
                        timeBeforeTrickMode = new Date().getTime();
                        tests.log(NAME, 'Set trick mode speed to ' + speed);
                        return command.execute(player.setTrickModeSpeed, [speed]);
                    })
                    .then(function () {
                        //tests.log(NAME, 'sleep');
                        return command.sleep(sleepDuration * 1000);
                    })
                    .then(function () {
                        //tests.log(NAME, 'register on seeked event');
                        return tests.executeAsync(command, player.waitForEvent, ['seeked'], config.asyncTimeout);
                    })
                    .then(function () {
                        timeAfterTrickMode = new Date().getTime();
                        return command.execute(video.getCurrentTime);
                    })
                    .then(function (time) {
                        videoTimeAfterTrickMode = time;

                        var deltaTime = (timeAfterTrickMode - timeBeforeTrickMode) / 1000,
                            deltaVideoTime = videoTimeAfterTrickMode - videoTimeBeforeTrickMode,
                            measuredSpeed = deltaVideoTime / deltaTime,
                            diffSpeed = Math.abs(measuredSpeed - speed);

                        tests.log(NAME, 'Trick mode measured speed = '+ measuredSpeed + " (" + speed + ")");
                        assert.isTrue(diffSpeed < Math.abs(speed * tolerance));
                    });
                },

                play: function () {
                    tests.log(NAME, 'Do play');
                    return command.execute(video.play)
                    .then(function () {
                        tests.log(NAME, 'Check if playing after ' + PROGRESS_DELAY + 's.');
                        return tests.executeAsync(command, video.isPlaying, [PROGRESS_DELAY], ASYNC_TIMEOUT)
                        .then(function (playing) {
                            assert.isTrue(playing);
                            return command.execute(player.getMute);
                        })
                        .then(function (isMute) {
                            tests.log(NAME, 'after trick test, mute = '+ isMute);
                            assert.isTrue(isMute === isMuteBeforeTrick);
                        });
                    });
                }
            });
        };


        for (i = 0; i < streams.length; i++) {

            // setup: load test page and stream
            testSetup(streams[i]);

            // Performs trick play with differents speeds
            for (j = 0; j < speedValues.length; j++) {
                test(speedValues[j],j%2 === 0? true:false);
            }
        }

});
