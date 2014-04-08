if (typeof require !== 'undefined') {
    // node.js module import    
    var mp4lib = require('./mp4lib.js');

    // standard node.js Long package is API-comaptible with Google Closure math Long,
    // see https://npmjs.org/package/long    
    var goog = { math: { Long : require("long") }};
}


mp4lib.fields.readBytes = function(buf, pos, nbBytes) {
    var value = 0;
    for (var i = 0; i < nbBytes; i++) {
        value = value << 8;
        value = value + buf[pos];
        pos++;
    }
    return value;
};

mp4lib.fields.writeBytes = function(buf, pos, nbBytes, value) {
    for (var i = 0; i < nbBytes; i++) {
        buf[pos + nbBytes - i - 1] = value & 0xFF;
        value = value >> 8;
    }
};

mp4lib.fields.readString = function( buf, pos, count ) {
    var res = "";
    for (var i=pos;i<pos+count;i++) {
        res = res+String.fromCharCode(buf[i]);
    }
    return res;
};

//------------------------------- NumberField -------------------------------

mp4lib.fields.NumberField = function(bits,signed) {
    this.bits = bits;
    this.signed = signed;
};

mp4lib.fields.NumberField.prototype.read = function(buf, pos) {
    return mp4lib.fields.readBytes(buf, pos, this.bits/8);
};

mp4lib.fields.NumberField.prototype.write = function(buf,pos,val) {
    mp4lib.fields.writeBytes(buf, pos, this.bits/8, val);
};

mp4lib.fields.NumberField.prototype.getLength = function(val) {
    return this.bits/8;
};

//------------------------------- 64BitsNumberField -------------------------------

mp4lib.fields.LongNumberField = function() {
};

mp4lib.fields.LongNumberField.prototype.read = function(buf, pos) {
    var high = mp4lib.fields.readBytes(buf, pos, 4);
    var low = mp4lib.fields.readBytes(buf, pos + 4, 4);
    return goog.math.Long.fromBits(low, high).toNumber();
};

mp4lib.fields.LongNumberField.prototype.write = function(buf, pos, val) {
    var longNumber = goog.math.Long.fromNumber(val);
    var low = longNumber.getLowBits();
    var high = longNumber.getHighBits();
    mp4lib.fields.writeBytes(buf, pos, 4, high);
    mp4lib.fields.writeBytes(buf, pos + 4, 4, low);
};

mp4lib.fields.LongNumberField.prototype.getLength = function(val) {
    return 8;
};

//------------------------------- FixedLenStringField -------------------------------

mp4lib.fields.FixedLenStringField = function(size) {
    this.size = size;
};

mp4lib.fields.FixedLenStringField.prototype.read = function(buf,pos) {
    var res = "";
    for (var i=0;i<this.size;i++) {
        res = res+String.fromCharCode(buf[pos+i]);
    }
    return res;
};

mp4lib.fields.FixedLenStringField.prototype.write = function(buf,pos,val) {
    for (var i=0;i<this.size;i++) {
        buf[pos+i] = val.charCodeAt(i);
    }
};

mp4lib.fields.FixedLenStringField.prototype.getLength = function(val) {
    return this.size;
};

//------------------------------- BoxTypeField -------------------------------

mp4lib.fields.BoxTypeField = function() {};

mp4lib.fields.BoxTypeField.prototype.read = function(buf,pos) {
    var res = "";
    for (var i=0;i<4;i++) {
        res = res+String.fromCharCode(buf[pos+i]);
    }
    return res;
};

mp4lib.fields.BoxTypeField.prototype.write = function(buf,pos,val) {
    for (var i=0;i<4;i++) {
        buf[pos+i] = val.charCodeAt(i);
    }
};

mp4lib.fields.BoxTypeField.prototype.getLength = function(val) {
    return 4;
};


//------------------------------- StringField -------------------------------

mp4lib.fields.StringField = function() {
};


mp4lib.fields.StringField.prototype.read = function(buf,pos,end) {
    var res = "";

    for (var i=pos;i<end;i++) {
        res = res+String.fromCharCode(buf[i]);
        if (buf[i]===0) {
            return res;
        }
    }

    if ((end-pos<255) && (buf[0]==String.fromCharCode(end-pos))) {
        res = res.substr(1,end-pos);
        mp4lib.warningHandler('null-terminated string expected, '+
                               'but found a string "'+res+'", which seems to be '+
                               'length-prefixed instead. Conversion done.');
        return res;
    }

    throw new mp4lib.ParseException('expected null-terminated string, '+
        'but end of field reached without termination. '+
        'Read so far:"'+res+'"');
};

mp4lib.fields.StringField.prototype.write = function(buf,pos,val) {
    for (var i=0;i<val.length;i++)
    {
        buf[pos+i] = val.charCodeAt(i);
    }
    buf[pos+val.length] = 0;
};

mp4lib.fields.StringField.prototype.getLength = function(val) {
    return val.length;
};

//------------------------------- BoxFillingDataField -------------------------------

mp4lib.fields.BoxFillingDataField= function() {
};

mp4lib.fields.BoxFillingDataField.prototype.read = function(buf,pos,end) {
    var res = buf.subarray(pos,end);
    return res;
};

mp4lib.fields.BoxFillingDataField.prototype.write = function(buf,pos,val) {
    buf.set(val,pos);
};

mp4lib.fields.BoxFillingDataField.prototype.getLength = function(val) {
    return val.length;
};

//------------------------------- ArrayField -------------------------------

mp4lib.fields.ArrayField = function(innerField,size) {
    this.innerField = innerField;
    this.size = size;
};

mp4lib.fields.ArrayField.prototype.read = function(buf,pos,end) {
    var innerFieldLength=-1;
    var res = [];
    for (var i=0;i<this.size;i++) {
        
        res.push(this.innerField.read(buf,pos));

        if (innerFieldLength==-1)
            innerFieldLength = this.innerField.getLength(res[i]);
            // it may happen that the size of field depends on the box flags, 
            // we need to count is having box and first structure constructed

        pos+=innerFieldLength;
    }
    return res;
};

mp4lib.fields.ArrayField.prototype.write = function(buf,pos,val) {
    var innerFieldLength=0;
    if (this.size>0) {
        innerFieldLength=this.innerField.getLength(val[0]);
    }

    for (var i=0;i<this.size;i++) {
        this.innerField.write(buf,pos,val[i]);
        pos+=innerFieldLength;
    }
};

mp4lib.fields.ArrayField.prototype.getLength = function(val) {
    var innerFieldLength=0;
    if (this.size>0) {
        innerFieldLength=this.innerField.getLength(val[0]);
    }
    return this.size*innerFieldLength;
};

// pre-defined shortcuts for common fields 
// ( it is recommended to use these shortcuts to avoid constructors 
//   being called for every field processing action )

mp4lib.fields.FIELD_INT8 = new mp4lib.fields.NumberField(8,true);
mp4lib.fields.FIELD_INT16 = new mp4lib.fields.NumberField(16,true);
mp4lib.fields.FIELD_INT32 = new mp4lib.fields.NumberField(32,true);
mp4lib.fields.FIELD_INT64 = new mp4lib.fields.LongNumberField();
mp4lib.fields.FIELD_UINT8 = new mp4lib.fields.NumberField(8,false);
mp4lib.fields.FIELD_UINT16 = new mp4lib.fields.NumberField(16,false);
mp4lib.fields.FIELD_UINT32 = new mp4lib.fields.NumberField(32,false);
mp4lib.fields.FIELD_UINT64 = new mp4lib.fields.LongNumberField();
mp4lib.fields.FIELD_BIT8 = new mp4lib.fields.NumberField(8,false);
mp4lib.fields.FIELD_BIT16 = new mp4lib.fields.NumberField(16,false);
mp4lib.fields.FIELD_BIT24 = new mp4lib.fields.NumberField(24,false);
mp4lib.fields.FIELD_BIT32 = new mp4lib.fields.NumberField(32,false);
mp4lib.fields.FIELD_ID = new mp4lib.fields.BoxTypeField(4);
mp4lib.fields.FIELD_STRING = new mp4lib.fields.StringField();
mp4lib.fields.FIELD_BOX_FILLING_DATA = new mp4lib.fields.BoxFillingDataField();
