"use strict";
import cp from "child_process";
import { promisify } from "./promises";

const execP = function (cmd, opt) {
	return new Promise(function (resolve, reject) {
		cp.exec(cmd, opt, function (err, stdout, stderr) {
			if (err) return reject(stderr);
			return resolve(stdout);
		});
	})
}

// Konstruiert die Kommandozeile für eine Abfrage
export function buildCommand(endpoint, mode = "get", payload = null) {
	let params = [
		'-u "Client_identity"',
		`-k "${options.key}"`
	];
	if (mode == "set") params.push('-m put');
	if (payload) params.push(`-e "${JSON.stringify(payload)}"`);
	return `coap-client ${params.join(" ")} "coaps://${options.host}:5684/${endpoint}" | awk 'NR==4'`;
}

// Sendet ein Kommando an einen Endpoint und parst die Antwort
export function queryEndpoint(endpoint, mode = "get", payload = null) {
	const cmd = buildCommand(endpoint, mode, payload);
	return new Promise((res, rej) => {
		execP(cmd)
			.then(data => {
				const result = JSON.parse(data);
				res(result);
			})
			.catch(err => {
				rej(err);
			});
	});
}