'use strict';

var grunt = require('grunt');

function areFilesEqual(filename) {
	var actual = grunt.util.normalizelf(grunt.file.read('tmp/' + filename));
	var expected = grunt.util.normalizelf(grunt.file.read('test/expected/' + filename));
	return (actual === expected);
}

exports.pseudolocalize = {
	setUp: function(done) {
		done();
	},
	basic: function(test) {
		test.expect(1);
		test.ok(areFilesEqual('basic.po'), 'should produce pseduo-English output');
		test.done();
	}
};
