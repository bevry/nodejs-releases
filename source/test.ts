// remote
import { deepEqual, equal, log } from 'assert-helpers'
import kava from 'kava'
import versionCompare from 'version-compare'

// local
import {
	preloadNodeReleases,
	getNodeReleaseIdentifiers,
	getNodeReleaseInformation,
} from './index.js'

kava.suite('@bevry/nodejs-releases', function (suite, test) {
	test('preload', function (done) {
		preloadNodeReleases()
			.then(() => done())
			.catch(done)
	})
	suite('getNodeReleaseIdentifiers', function (suite, test) {
		const actual = getNodeReleaseIdentifiers()
		log(actual)
	})
	test('sort order is chronological version numbers', function () {
		const actual = getNodeReleaseIdentifiers()
		const sorted = actual.slice().sort(versionCompare)
		equal(actual.join(', '), sorted.join(', '), 'sort order is oldest first')
	})
	test('fetchNodeReleaseInformation', function () {
		const result = getNodeReleaseInformation('4.9.1')
		log(result)
	})
	test('getNodeReleaseInformation', function () {
		log(getNodeReleaseInformation('4.9.1'))
	})
	test('getReleases', function () {
		getNodeReleaseIdentifiers().map((v) => getNodeReleaseInformation(v))
		// don't log, as is huge
	})
	suite('is immutable array', function (suite, test) {
		const mutated = getNodeReleaseIdentifiers()
		mutated.push('changed')
		const source = getNodeReleaseIdentifiers()
		equal(
			mutated.length,
			source.length + 1,
			'the lengths of the arrays should not be the same, as the source array should remain immutable',
		)
	})
	suite('is immutable object', function (suite, test) {
		const mutated = getNodeReleaseInformation('4.9.1')
		mutated.version = '4.9.1-mutated'
		const source = getNodeReleaseInformation('4.9.1')
		equal(
			mutated.version,
			'4.9.1-mutated',
			'mutation should have been applied to the mutable returned object',
		)
		equal(
			source.version,
			'4.9.1',
			'however the mutation should not have been applied to the source object',
		)
	})
})
