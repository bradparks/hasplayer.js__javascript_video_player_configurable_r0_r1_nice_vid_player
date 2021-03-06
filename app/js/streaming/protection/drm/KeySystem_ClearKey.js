/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */

MediaPlayer.dependencies.protection.KeySystem_ClearKey = function() {
    "use strict";

    var keySystemStr = "org.w3.clearkey",
        keySystemUUID = "1077efec-c0b2-4d02-ace3-3c1e52e2fb4b",
        protData;

    return {

        system: undefined,
        schemeIdURI: "urn:uuid:" + keySystemUUID,
        systemString: keySystemStr,
        uuid: keySystemUUID,
        sessionType:"temporary",

        init: function(protectionData){
            protData = protectionData;
        },

        getInitData: MediaPlayer.dependencies.protection.CommonEncryption.parseInitDataFromContentProtection,

        getKeySystemConfigurations: MediaPlayer.dependencies.protection.CommonEncryption.getKeySystemConfigurations,

        getRequestHeadersFromMessage: function(/*message*/) { return null; },

        getLicenseRequestFromMessage: function(message) { return new Uint8Array(message); },

        getLicenseServerURLFromInitData: function(/*initData*/) { return null; },

        getCDMData: function () {return null;}
    };
};

MediaPlayer.dependencies.protection.KeySystem_ClearKey.prototype = {
    constructor: MediaPlayer.dependencies.protection.KeySystem_ClearKey
};

/**
 * Returns desired clearkeys (as specified in the CDM message) from protection data
 *
 * @param {MediaPlayer.vo.protection.ProtectionData} protData the protection data
 * @param {ArrayBuffer} message the ClearKey CDM message
 * @returns {MediaPlayer.vo.protection.ClearKeyKeySet} the key set or null if none found
 * @throws {Error} if a keyID specified in the CDM message was not found in the
 * protection data
 * @memberof MediaPlayer.dependencies.protection.KeySystem_ClearKey
 */
MediaPlayer.dependencies.protection.KeySystem_ClearKey.getClearKeysFromProtectionData = function(protData, message) {
    var clearkeySet = null;
    if (protData) {
        // ClearKey is the only system that does not require a license server URL, so we
        // handle it here when keys are specified in protection data
        var jsonMsg = JSON.parse(String.fromCharCode.apply(null, new Uint8Array(message)));
        var keyPairs = [];
        for (var i = 0; i < jsonMsg.kids.length; i++) {
            var clearkeyID = jsonMsg.kids[i],
                    clearkey = (protData.clearkeys.hasOwnProperty(clearkeyID)) ? protData.clearkeys[clearkeyID] : null;
            if (!clearkey) {
                throw new Error("[DRM] ClearKey keyID (" + clearkeyID + ") is not known!");
            }
            // KeyIDs from CDM are not base64 padded.  Keys may or may not be padded
            keyPairs.push(new MediaPlayer.vo.protection.KeyPair(clearkeyID, clearkey));
        }
        clearkeySet = new MediaPlayer.vo.protection.ClearKeyKeySet(keyPairs);
    }
    return clearkeySet;
};


