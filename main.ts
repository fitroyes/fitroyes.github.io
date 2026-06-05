import { walk } from "@std/fs";
import { dirname } from "@std/path";
import { render, Renderer } from "@deno/gfm";
import {
	type HTML,
	html,
	htmlAttr,
	htmlRoot,
} from "@huguesguilleus/blogger/html";
import * as TOML from "@std/toml";

const articles: { path: string; title: string }[] = [];
const STYLE = (await Deno.readTextFile("style.css")).replaceAll(/[\t\n]+/g, "");

// Init public output directoiry
await Deno.remove("public", { recursive: true }).catch((_) => {});
await Deno.mkdir("public", { recursive: true });

// Copy static files
async function copyStatic(path: string) {
	console.log("static:", path);
	await Deno.mkdir(dirname("public/" + path), { recursive: true });
	await Deno.copyFile(path, "public/" + path);
}
copyStatic("404.html");
for await (const { path } of walk(".", { exts: [".pdf", ".webp", ".ttf"] })) {
	await copyStatic(path);
}
Deno.writeTextFile("public/robots.txt", "User-agent: *\nAllow: /\n");

// Render markdown files
for await (const { path } of walk(".", { exts: [".md"] })) {
	if (path == "README.md") continue;
	console.log("md:", path);

	const data = await Deno.readTextFile(path);
	const [_, meta, file] = data.startsWith("+++")
		? data.split("+++", 3)
		: [0, "", data];
	const { title = "", author = "", desc = "" } = TOML.parse(meta) as {
		title?: string;
		author?: string;
		desc?: string;
	};
	articles.push({ path: path.replace(/\.md$/, ".html"), title: title || path });

	const renderer = new Renderer();
	renderer.heading = ({ depth, text }) => {
		return html("h" + depth, "#".repeat(depth), " ", text).h;
	};

	await Deno.mkdir(dirname("public/" + path), { recursive: true });
	Deno.writeTextFile(
		"public/" + path.replace(/\.md$/, ".html"),
		htmlRoot(
			"html lang=fr",
			html(
				"head",
				html("meta charset=utf-8"),
				html('meta name=viewport content="width=device-width,initial-scale=1"'),
				html("link rel=icon href=/favicon.webp type=image/webp"),
				!!desc && htmlAttr`meta name=dscription content="${desc}"`(),
				html("title", title),
				html("style", { h: STYLE }),
			),
			html(
				"body",
				html(
					"header",
					html("h1", html("a href=/ id=home", "///"), " ", title),
					!!author && html("", "@", author),
				),
				html("main", { h: render(file, { renderer }).replaceAll("\n", "") }),
			),
		),
	);
}

// Global index
console.log("index");
function social(name: string, url: string): HTML {
	return htmlAttr`a.link.social href='${url}'`(name);
}
function notes(lines: string[] = []): HTML[] {
	return lines.map((line) =>
		/^https?:\/\//.test(line)
			? htmlAttr`a href='${line}'`(line)
			: html("p", line)
	);
}
Deno.writeTextFile(
	"public/index.html",
	htmlRoot(
		"html lang=fr",
		html(
			"head",
			html("meta charset=utf-8"),
			html('meta name=viewport content="width=device-width,initial-scale=1"'),
			html("link rel=icon href=/favicon.webp type=image/webp"),
			html("title", "LFI Troyes"),
			html("style", { h: STYLE }),
			html(
				'meta name="google-site-verification" content="FqYntXZY5LcPR-dAONHhpErCyRHBeoRvF_UIuYGZ4Rc"',
			),
		),
		html(
			"header",
			html("h1", html("a id=home", "///"), " Accueil"),
			"Bienvenu sur le blog des insoumis·es de Troyes, nous mettrons ici des données ou des infographies.",
		),
		html("h1.hb", "Nos réseaux"),
		html(
			"div.blocks",
			social("Mail", "mailto:troyesinsoumise@gmail.com"),
			social("Instagram IJ", "https://instagram.com/fi_troyes"),
			social("GitHub", "https://github.com/fitroyes/"),
			social("YouTube", "https://www.youtube.com/@JITroyes"),
		),
		html(
			"div.blocks",
			social(
				"L'Union populaire de Troyes",
				"https://actionpopulaire.fr/groupes/39a6ca83-aa82-4f8a-b743-1e00aaf38b54/",
			),
			social(
				"Les jeunes insoumis·es de Troyes",
				"https://actionpopulaire.fr/groupes/e5b88d81-1ec3-4c50-a2ff-7f180373177f/",
			),
			social(
				"Chartreux",
				"https://actionpopulaire.fr/groupes/4a086f40-db22-4f23-9441-34f16718455c/",
			),
			social(
				"Chartreux insoumis",
				"https://actionpopulaire.fr/groupes/951f76a4-1be7-4f91-88f4-b5086f439b2e/",
			),
			social(
				"Sainte-Savine - Troyes Nord-Ouest",
				"https://actionpopulaire.fr/groupes/f2693390-b07d-4e95-9ab1-5b2d990221db/",
			),
			social(
				"Saint-Julien-les-Villas",
				"https://actionpopulaire.fr/groupes/835100c0-eb67-4332-bc05-e2ba025d35cc/",
			),
			social(
				"Sainte-Savine - Troyes Nord-Ouest",
				"https://actionpopulaire.fr/groupes/f2693390-b07d-4e95-9ab1-5b2d990221db/",
			),
		),
		html("h1.hb", "Les pétitions"),
		html(
			"div.blocks",
			html(
				"div.bl.petition",
				html("h3", "Violations des droits de l’homme par Israël"),
				notes([
					"Selon la Commission européenne, l’État d’Israël est responsable d’un nombre sans précédent de morts et de blessés parmi les civils, de déplacements à grande échelle de la population et de la destruction systématique des hôpitaux et des installations médicales à Gaza. Israël a également mis en place un blocus de l’aide humanitaire, qui pourrait s’apparenter à un recours à la famine comme méthode de guerre. Israël enfreint de multiples règles et obligations prévues par le droit international, et ne prévient pas le crime de génocide, contrairement à ce qui a été ordonné par la Cour internationale de justice.",
					"https://eci.ec.europa.eu/055/public/?lg=fr",
				]),
			),
			html(
				"div.bl.petition",
				html("h3", "Vérifier votre inscription électorale"),
				notes([
					"https://www.service-public.gouv.fr/particuliers/vosdroits/R51788",
				]),
			),
		),
		html("h1.hb", "Les articles"),
		html(
			"div.articles",
			articles.sort((a, b) => a.title.localeCompare(b.title)).map((article) =>
				htmlAttr`a.link.article href='/${article.path}'`(article.title)
			),
		),
	),
);
