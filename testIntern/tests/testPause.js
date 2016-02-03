/**
TEST_PAUSE:

- load test page
- for each stream:
    - load stream
    - check if <video> is playing
    - wait for N seconds
    - repeat N times:
        - pause the player (OrangeHasPlayer.pause())
        - check if <video> is paused
        - check if <video> is not progressing
        - resume the player (OrangeHasPlayer.play())
        - check if <video> is playing
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

        var command = null;

        var NAME = 'TEST_PAUSE';
        var PROGRESS_DELAY = 2; // Delay for checking progressing (in s) 
        var ASYNC_TIMEOUT = PROGRESS_DELAY + 5;  // Asynchronous timeout for checking progressing
        var PAUSE_DELAY = 5; // Delay (in s) for checking is player is still paused (= not prgressing)
        var i, j;
        
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
                        tests.log(NAME, 'Check if playing');
                        return tests.executeAsync(command, video.isPlaying, [PROGRESS_DELAY], ASYNC_TIMEOUT);
                    })
                    .then(function (playing) {
                        assert.isTrue(playing);
                        var sleepTime = Math.round(Math.random() * 20);
                        tests.log(NAME, 'Sleep ' + sleepTime + ' s.');
                        return command.sleep(sleepTime * 1000);
                    });
                }
            });
        };

        var testPause = function () {

            registerSuite({
                name: NAME,

                pause: function () {
                    var currentTime = 0;

                    tests.log(NAME, 'Pause the player');
                    return command.execute(player.pause)
                    .then(function () {
                        tests.log(NAME, 'Check if paused');
                        return command.execute(video.isPaused);
                    })
                    .then(function (paused) {
                        assert.isTrue(paused);
                        return command.execute(video.getCurrentTime);
                    })
                    .then(function (time) {
                        currentTime = time;
                        tests.log(NAME, 'Check if not progressing');
                        tests.log(NAME, 'Current time = ' + time );
                        return command.sleep(PAUSE_DELAY * 1000);
                    })
                    .then(function () {
                        return command.execute(video.getCurrentTime);
                    })
                    .then(function (time) {
                        tests.log(NAME, 'Current time = ' + time);
                        assert.strictEqual(time, currentTime);
                        tests.log(NAME, 'Resume the player');
                        return command.execute(player.play);
                    })
                    .then(function () {
                        tests.log(NAME, 'Check if playing');
                        return tests.executeAsync(command, video.isPlaying, [PROGRESS_DELAY], ASYNC_TIMEOUT);
                    })
                    .then(function (playing) {
                        assert.isTrue(playing);
                    });
                }
            });
        };


        for (i = 0; i < config.testPause.streams.length; i++) {

            // setup: load test page and stream
            testSetup(config.testPause.streams[i]);

            // Performs pause tests
            for (j = 0; j < config.testPause.pauseCount; j++) {
                testPause();
            }
        }

});
