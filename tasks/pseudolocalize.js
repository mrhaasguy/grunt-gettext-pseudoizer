/*
 * Adapted from
 * https://github.com/mrussell/grunt-pseudolocalize
 */

module.exports = function(grunt) {
	'use strict';
	var _ = require('lodash'),
	PO = require('pofile'),
	defaults = {
		padPercent: 0,
		padString: 'x',
		prefix: '',
		suffix: '',
		splitRegex: ''
	},
	pseudoUpper = [
		'\u0102', //A - 65
		'\u00DF', //B - 66
		'\u0108', //C - 67
		'\u010E', //D - 68
		'\u01A9', //E - 69
		'\u0191', //F - 70
		'\u0193', //G - 71
		'\u0124', //H - 72
		'\u0128', //I - 73
		'\u0135', //J - 74
		'\u040C', //K - 75
		'\u00A3', //L - 76
		'\u028D', //M - 77
		'\u019D', //N - 78
		'\u01D1', //O - 79
		'\u01A4', //P - 80
		'\u01EC', //Q - 81
		'\u01A6', //R - 82
		'\u0405', //S - 83
		'\u04AC', //T - 84
		'\u01D3', //U - 85
		'\u0476', //V - 86
		'\u019C', //W - 87
		'\u0416', //X - 88
		'\u00A5', //Y - 89
		'\u01B5'  //Z - 90
	],
	pseudoLower = [
		'\u0103', // a - 97
		'\u0253', // b - 98
		'\u0109', // c - 99
		'\u0257', // d - 100
		'\u0205', // e - 101
		'\u0192', // f - 102
		'\u0260', // g - 103
		'\u0267', // h - 104
		'\u0268', // i - 105
		'\u0135', // j - 106
		'\u0137', // k - 107
		'\u013C', // l - 108
		'\u0271', // m - 109
		'\u019E', // n - 110
		'\u01D2', // o - 111
		'\u03C1', // p - 112
		'\u01A3', // q - 113
		'\u027E', // r - 114
		'\u0161', // s - 115
		'\u01AD', // t - 116
		'\u028A', // u - 117
		'\u028B', // v - 118
		'\u026F', // w - 119
		'\u03F0', // x - 120
		'\u0263', // y - 121
		'\u0290'  // z - 122
	];

	function process(val, options) {
		var padding = '', output = '';

		if (typeof val === 'object') {
			var result = {};

			for (var key in val) {
				result[key] = process(val[key], options);
			}

			return result;
		} else if (val) {
			if (options.padPercent > 0) {
				var len = Math.round(val.length * options.padPercent),
					pads = Math.ceil(len / options.padString.length);
				padding = (new Array(pads + 1).join(options.padString)).slice(0, len);
			}

			if (options.splitRegex) {
				var splitter = new RegExp('(' + options.splitRegex + ')'), i;
				// wrap value in single character so that we know first element will never be match
				var parts = ('x' + val + 'x').split(splitter);
				for (i = 0; i < parts.length; i++) {
					if (i % 2 === 0) { // only localize unmatched parts of input
						parts[i] = pseudo(parts[i]);
					}
				}
				output = parts.join('').slice(1, -1);  // cut off temp chars we added				
			} else {
				output = pseudo(val);
			}			
		}

		return options.prefix + output + padding + options.suffix;
	}

	function pseudo(val) {
		var code, output = '';
		if (val) {
			for (var i = 0; i < val.length; i += 1) {
				code = val.charCodeAt(i);
				if (code > 64 && code < 91) { // uppercase
					code -= 65;
					output += pseudoUpper[code];
				} else if (code > 96 && code < 123) { // lowercase
					code -= 97;
					output += pseudoLower[code];
				} else {
					output += val.charAt(i);
				}
			}
		}
		return output;
	}

	grunt.registerMultiTask('pseudoize',
		'Pseudolocalize English JSON key-value locale file for testing purposes.', function() {
		var done = this.async();
		var options = this.options(defaults);
		
		if (Number.isNaN(options.padPercent) || (options.padPercent < 0 || options.padPercent > 1)) {
			grunt.fatal(grunt.log.wraptext(80,
			"Optional 'padPercent' setting must be a number between 0 and 1 representing " +
			"percentage of input string\nlength to increase by (e.g. 0.25 adds 25% length."));
		}

		if (options.padPercent > 0 && !options.padString) {
			grunt.fatal("Optional 'padString' must be a non-empty string value (default 'x')");
		}

		this.files.forEach(function(file) {

			if (file.dest) {

				var sourceFile = file.src[0];
				
				grunt.log.notverbose.ok(file.src);
				if (!grunt.file.exists(sourceFile)) {
					grunt.log.warn('Source file "' + sourceFile + '" not found.');
					return false;
				}
				
				grunt.log.notverbose.ok('Loading source files...');
				PO.load(sourceFile, function(err, po){
	
					if (err){
						grunt.warn('Error loading po file ' + sourceFile);
						return;
					}
					
					_.forEach(po.items, function(item) {
						item.msgstr[0] = process(item.msgid, options);
						if (item.msgid_plural){
							item.msgstr[1] = process(item.msgid_plural, options);
						}
					});
					
					po.save(file.dest, function (err) {
						if (err){
							grunt.warn('Error saving po file ' + file.dest);
							return;
						}
						grunt.log.notverbose.ok('File "' + file.dest + '" written.');
						done();
					});
				});

			} else {
				grunt.warn('No destination supplied; nothing to do.');
			}

		});
	});

};
