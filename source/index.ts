// Import
import Errlop from 'errlop'
import fetch from 'node-fetch'
import versionCompare from 'version-compare'

/**
 * A complete version number of the Node.js release.
 * @example `"0.1.14"`
 */
export type NodeReleaseIdentifier = string

/** A complete version number of the Node.js release.
 * @example `0.1.14`
 * @example `"0.1.14"`
 */
export type NodeReleaseInput = string | number

/** The meta information of a Node.js release. */
export interface NodeReleaseInformation {
	/**
	 * The complete version number of the Node.js release.
	 * @example `"0.1.14"`
	 */
	version: NodeReleaseIdentifier

	/**
	 * The date of this Node.js release.
	 * @example `new Date('2011-08-26')`
	 */
	date: Date

	/**
	 * The files included in the distribution.
	 * @example `["src"]`
	 * @example `["headers", "linux-arm64", ...]`
	 */
	files: Array<string>

	/**
	 * The version of V8 that is included in this Node.js release.
	 * @example `"9.1.269.36"`
	 */
	v8: string

	/**
	 * The version of NPM that is included in this Node.js release.
	 * @example `"7.18.1"`
	 */
	npm?: string

	/**
	 * The version of UV that is included in this Node.js release.
	 * @example `"1.41.0"`
	 */
	uv?: string

	/**
	 * The version of zlib that is included in this Node.js release.
	 * @example `"1.2.11"`
	 */
	zlib?: string

	/**
	 * The version of OpenSSL that is included in this Node.js release.
	 * @example `"1.1.1k+quic"`
	 */
	openssl?: string

	/** @example `"93"` */
	modules?: string

	/**
	 * If this Node.js release is LTS, then it is is the LTS codename attached to that LTS line for this signficant version, otherwise `false`.
	 * @example `false` if not LTS
	 * @example `"Fermium"` for the  associated LTS codename
	 */
	lts: false | string

	/**
	 * This property is provided but appears unused.
	 * @example `false`
	 */
	security: boolean
}

/** The URL of the Node.js releases API. */
const url = `https://nodejs.org/download/release/index.json`

/** The raw response from the Node.js releases API. */
type NodeReleaseResponse = Array<
	NodeReleaseInformation & {
		/** @example `v0.1.14`, notice the v is present, it will be trimmed when parsed */
		version: string

		/** @example `2011-08-26`, notice the string format, it will be converted when parsed */
		date: string
	}
>

/**
 * The Node.js releases, as a Map of a release version number to its release information.
 * Sorted by the version number chronologically (e.g. 0.1.0, 0.1.1, 1.0.0, ...), as hotfixes would otherwise intermix newer patches of older releases, with the latest releases (e.g. 0.1.0, 1.0.0, 0.1.1).
 */
type NodeReleaseMap = Map<NodeReleaseIdentifier, NodeReleaseInformation>

/** The fetched {@link NodeReleaseMap} */
const nodeReleaseMap: NodeReleaseMap = new Map<
	NodeReleaseIdentifier,
	NodeReleaseInformation
>()

/**
 * The Node.js releases, as an Array of its release version numbers.
 * Sorted by the version number chronologically (e.g. 0.1.0, 0.1.1, 1.0.0, ...), as hotfixes would otherwise intermix newer patches of older releases, with the latest releases (e.g. 0.1.0, 1.0.0, 0.1.1).
 */
export type NodeReleaseIdentifiers = Array<NodeReleaseIdentifier>

/** The fetched {@link NodeReleaseIdentifiers} */
const nodeReleaseIdentifiers: NodeReleaseIdentifiers = []

/**
 * Fetch Node.js releases from the API.
 */
export async function preloadNodeReleases(): Promise<void> {
	if (nodeReleaseIdentifiers.length) return
	try {
		// fetch the node.js releases
		const response = await fetch(url, {})
		const json: NodeReleaseResponse = await response.json()

		// parse it, then sort it, then add it
		const results: Array<NodeReleaseInformation> = []
		for (const rawVersion of json) {
			// parse
			const version = rawVersion.version.replace('v', '')
			const date = new Date(rawVersion.date)
			// push for sorting, then adding
			results.push({ ...rawVersion, version, date })
		}
		// sort
		results.sort((a, b) => versionCompare(a.version, b.version))

		// add
		for (const meta of results) {
			nodeReleaseMap.set(meta.version, meta)
			nodeReleaseIdentifiers.push(meta.version)
		}
	} catch (err) {
		throw new Errlop(
			`Failed to fetch Node.js release information from the API: ${url}`,
			err
		)
	}
}

// @note we don't allow access to the map directly, as its a API waste of time, as do they want the details as an array, or as a keyed object, or as a map array, or as map? Too much complexity.

/**
 * Get from the cache the Node.js release information for a specific Node.js release version.
 * Requires {@link preloadNodeReleases} to have been previously awaited.
 * @returns an immutable copy of the release information
 */
export function getNodeReleaseInformation(
	version: NodeReleaseInput
): NodeReleaseInformation {
	// fetch
	const info = nodeReleaseMap.get(String(version))
	// check
	if (!info) {
		if (nodeReleaseIdentifiers.length === 0) {
			throw new Error(
				`Unable to get the release information for Node.js version [${JSON.stringify(
					version
				)}] as the cache was empty.\nFetch first, then try again.`
			)
		}
		throw new Error(
			`Unable to find the release information for Node.js version [${JSON.stringify(
				version
			)}] in the cache.\nCheck the version number is valid and try again.\nVersion numbers that do exist are: [${nodeReleaseIdentifiers.join(
				', '
			)}]`
		)
	}
	// return
	return { ...info }
}

/**
 * Get from the cache the Node.js release version numbers.
 * Requires {@link preloadNodeReleases} to have been previously awaited.
 * @returns immutable array of {@link nodeReleaseIdentifiers}
 */
export function getNodeReleaseIdentifiers(): NodeReleaseIdentifiers {
	// fetch safely
	if (nodeReleaseIdentifiers.length) return nodeReleaseIdentifiers.slice()
	// fail
	throw new Error(
		`Node.js releases have not yet been fetched.\nFetch first, then try again.`
	)
}
