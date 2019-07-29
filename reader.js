// UNCLASSIFIED
//  https://towardsdatascience.com/a-comparison-between-spacy-ner-stanford-ner-using-all-us-city-names-c4b6a547290
// https://github.com/explosion/spacy-stanfordnlp
// https://github.com/explosion/spaCy/issues/259
// https://www.novetta.com/2018/08/evaluating-solutions-for-named-entity-recognition/
// https://www.datacamp.com/community/blog/spacy-cheatsheet
// https://towardsdatascience.com/a-comparison-between-spacy-ner-stanford-ner-using-all-us-city-names-c4b6a547290
// https://towardsdatascience.com/a-review-of-named-entity-recognition-ner-using-automatic-summarization-of-resumes-5248a75de175
// https://blog.exsilio.com/all/accuracy-precision-recall-f1-score-interpretation-of-performance-measures/
// https://en.wikipedia.org/wiki/Precision_and_recall

// https://sites.cs.ucsb.edu/~wychen/publications/plda-aaim09.pdf
// https://bcatctr.github.io/paraLDA/

/**
 @requires enum
 @requires fs
 @requires node-xlsx
 @requires jsdom
 @requires xml2js
 @requires unoconv
 @requires htmlparser
 @requires pdf2json
 @requires yql
 @requires natural
 @requires teacher
 @requires lda
 */

var 
	// nodejs bindings
	FS = require('fs'),			// File system

	// totem
	//HACK = require('geohack'), 			// chipper+detector workflow

	// 3rd party
	//XMLP = require("htmlparser"),			// HTML parser
	//OO = require('office'),				// Open Office parser
	//SPELL = require('teacher'),				// Spell checker - requires service.afterthedeadline.com
	
	JSDOM = require('jsdom'),				// Web site crawler	
	XML2JS = require('xml2js'), 	// XML2JS reader	
	PDFP = require('pdf2json/pdfparser'), 	// PDF parser
	YQL = require('yql'),					// Cooperating site scrapper
	EXCEL = require('node-xlsx'),			// Excel parser
	ANLP = require('natural'),				// Natural Language Parsing (Bayes or Logireg)
	SNLP = require('node-nlp'), 		// NLP via Stanford NER
	LDA = require('lda'), 					// NLP via Latent Dirichlet Allocation
	XML2JS = require("xml2js"),					// xml to json parser 	
	UNO = require('unoconv'); 				// File converter/reader

var 										// totem bindings
	READ = module.exports = {
		config	: configReader,
		readers: {
			//idop	: idop_Reader,
			//jpg		: jpg_Reader,
			//py		: py_Reader,
			//js		: js_Reader,
			//db		: db_Reader,
			//jade	: jade_Reader,
			xls	: xls_Reader,	
			txt		: txt_Reader,	
			html	: html_Reader,
			yql		: yql_Reader,
			odt		: odt_Reader,
			odp		: odp_Reader,
			ods		: ods_Reader,
			pdf		: pdf_Reader,
			xml		: xml_Reader
		},			
		readFile: readFile,
		anlpDoc: anlpDoc,
		snlpDoc: snlpDoc,
		ldaDoc: ldaDoc,
		enabled : true,
		paths: {
			nlpCorpus: "./nlp_corpus.txt",
			//nlpClasssifier: "./nlp_classifier.txt",
			nlpRuleset: "./nlp_pos_rules.txt",
			nlpLexicon: "./nlp_pos_lexicon.txt"
		},
		trials 	:  [  // nlp trials
'Windows sucks.',
'circular polarized beams are my favorite.',
'Most regression algorithims are not experimental.',
'hyperspectral data is great for detecting some things.',
'Milenio sent some money to a DTO and Fred Smiley.',
'Milenio conspired with Sinola to threaten and kill and butcher Dr Smiley.'
		],
		minTextLen : 10,				// Min text length to trigger indexing
		minReadability : -9999,			// Min relevance score to trigger ANLP
		minRelevance: 0.0, 				// Min ANLP relevance to tripper intake
		spellRubric: {
			"spelling": 3,
			"suggestion": 1,
			"grammar": 2
		}
	};

function configReader (sql) {
	var 
		recs = 0,
		stanford = READ.stanford,
		classif = READ.classif,
		paths = READ.paths;
	
	if (sql) {		// train and test nlp classifier
		sql.query('SELECT * FROM app.nlprules WHERE Enabled', (err,rules) => {
			
			rules.forEach( rule => {
				stanford.addDocument( "en", rule.Usecase, rule.Index );
			
				classif.forEach( cls => {
					cls.addDocument(rule.Usecase, rule.Index);
				});
			});

			if (rules.length) {
				( async() => {
					await stanford.train();
					stanford.save();
				}) ();
				
				if ( trials = READ.trials) {
					( async() => {
						var test = await stanford.process("en", trials.join("") );
						Log("SNLP", test);
					}) ();
				}
				
				classif.forEach( (cls,n) => {
					cls.train();

					if ( paths.nlpClasssifier )
						cls.save(paths.nlpClasssifier+n, err => Log( err || "ANLP classifier saved" ) );
				});
			
				if ( trials = READ.trials) 
					classif.forEach( (cls,n) => {
						trials.forEach( trial => {
							Log(trial, `ANLP${n}=>`, cls.classify(trial));
						});
					});
			}			
		});
	}
	
	else {	// initial config to avoid whacky ANLP Array conflicts
		var
			Stanford = SNLP.NlpManager,
			stanford = READ.stanford = new Stanford({ languages: ["en"] }),
			
			Classifier = [ANLP.BayesClassifier, ANLP.LogisticRegressionClassifier],
			Checker = ANLP.Spellcheck,
			Trie = ANLP.Trie,
			Stemmer = ANLP.PorterStemmer,
			Analyzer = ANLP.SentimentAnalyzer,
			Tokenizer = ANLP.WordTokenizer, //ANLP.WordTokenizer,
			corpus = FS.readFileSync( paths.nlpCorpus, "utf8" ).replace(/^-/g,"").replace(/\n/gm," ").split(" "),
			checker = READ.checker = new Checker( corpus, true ),
			analyzer = READ.analyzer = new Analyzer("English", Stemmer, "pattern"),
			tokenizer = READ.tokenizer = new Tokenizer(),
			stemmer = READ.stemmer = Stemmer.stem,
			rules = READ.rules = new ANLP.RuleSet(paths.nlpRuleset),
			lexicon = READ.lexicon = new ANLP.Lexicon(paths.nlpLexicon, "?"),
			tagger = READ.tagger = new ANLP.BrillPOSTagger(lexicon,rules);

		try {
			var classif = READ.classif = [];
			Classifier.forEach( (Cls,n) => {
				classif[n] = Cls.restore(JSON.parse(FS.readFileSync(paths.nlpClasssifier+n)));
			});
		}
		catch (err) {
			var classif = READ.classif = [];
			Classifier.forEach( (Cls,n) => {
				classif[n] = new Cls();
			});
		}
			
		stanford.addNamedEntityText(["DTO", "CTO", "hawk", "lieutenant", "police officer", "politician", "officer", "suspect", "windows", "OS"]);
	}
}

function xls_Reader(sql,path,cb) {
	var 
		sheets = EXCEL.parse(path),
		recs = [];

	if (sheets)
		sheets.forEach( function (sheet, n) {  // sheet - no formulas allowed
			var 
				vars = new Array(sheet.maxCol),
				data = sheet.data;

			data.forEach( function (row, j) {
				var
					rec = new Object({ID:j, sheet: sheet.name});

				if ( j ) {
					recs.push(rec);
					row.forEach( function (cell, i) {
						rec[vars[i]] = cell;
					});
				}

				else   // 1st record is the header containing field names
					row.forEach( function (cell, i) {
						vars[i] = cell;
					});
			});
		});

	cb(recs);
}

function txt_Reader(sql,path,cb) {
	try {
		cb( FS.readFileSync( path,'utf8') );
	} 
	catch (err) {
		Log(err);
		cb( "" );
	};
}

function odp_Reader(sql,path,cb) {	
}

function ods_Reader(sql,path,cb) {	
	UNO.convert(path, "ooxml", {output:"./tmps/"+path}, function (err,data) {
		FS.readFile("./tmps/"+path, 'utf-8', function (err,data) {
			XML2JS.parseString(data, function (err,json) {
//console.log(json);
				Each(json["Workbook"]["ss:Worksheet"], function (n,sheet) {
console.log(sheet);
				Each(sheet["Table"], function (n,table) {
					if (n==0) {
console.log(table);
						var col = table.Column, row = table.Row;
//console.log(row);
//console.log(col);
					}
				}); });
			});		
		});
	}); 
}

function odt_Reader(sql,path,cb) {	

	if (false) { 	// retains 1st image in folder=~/tmp
		var handler = new XMLP.DefaultHandler(function (error, dom) {
			var ELS = XMLP.DomUtils.getElements();
			var IMG = XMLP.DomUtils.getElementsByTagName("IMG", dom);
			var HTML = XMLP.DomUtils.getElementsByTagName("HTML", dom);
			var P = XMLP.DomUtils.getElementsByTagName("P", dom); //[0].children[0].raw;
		});
		OO.parse(path, {img:true}, function(err, filepath) {  // output=~/
			FS.readFile(filepath, 'utf-8', function(err, data) {
				var parser = new XMLP.Parser(handler);
				parser.parseComplete(data);
			});
		});
	}
	else
	if (false) {  	// drop images (output to stdout)
		var handler = new XMLP.DefaultHandler(function (error, dom) {
			var ELS = XMLP.DomUtils.getElements();
			console.log("xmlp err="+error+" els="+ELS.length);

			var IMG = XMLP.DomUtils.getElementsByTagName("IMG", dom);
			console.log("IMG="+IMG);

			var HTML = XMLP.DomUtils.getElementsByTagName("HTML", dom);
			console.log("HTML=");
			console.log(HTML);

			var P = XMLP.DomUtils.getElementsByTagName("P", dom); //[0].children[0].raw;
			console.log("P=");
			//console.log(P);
		});

		OO.parse(path, function(err, data) {
			var parser = new XMLP.Parser(handler);
			parser.parseComplete(data);			
		});	
	}		
	else 			// use ooxml (UNO has problems with xml)  retains 1st image in public/tmp
		UNO.convert(path, "ooxml", {output:"./tmps/"+path}, function (err,data) {
			FS.readFile("./tmps/"+path, 'utf-8', function (err,data) {
				XML2JS.parseString(data, function (err,json) {
					Each(json["w:wordDocument"]["w:body"], function (n,body) {
					Each(body["w:p"], function (n,para) {
					Each(para["w:r"], function (n,recd) {
					Each(recd["w:t"], function (n,text) {
						cb({Text: text});
					}); }); }); });
				});					
			});
		}); 
}

function xml_Reader(sql,path,cb) { 
	FS.readFile(path,'utf-8', function (err,data) {
		XML2JS.parseString(data, function (err,json) {
			for (var n in json) console.log(json);
		});
	});
}

function pdf_Reader(sql,path,cb) {
	console.log("pdfrdr");

	var PDF = new PDFP();

	PDF
	.on("pdfParser_dataReady", function(evtData) {
		console.log(evtData);

		if ((!!evtData) && (!!evtData.data))  {
			var npages=evtData.data.Pages.length;
			var text = "";

			Each(evtData.data.Pages, function (pn,page) {
				Each(page.Texts, function (tn,txt) {
					Each(txt.R, function (rn,report) {
						text += unescape(report.T)+" ";
					});
				});
			});

			console.log("PDF INGESTED "+npages+" pages "+text.length+" chars");

			cb(text);
		}
	})
	.on("pdfParser_dataError", function(evtData) {
		console.log("PDF ERROR "+evtData.data);
	});

	console.log("pdf="+path);
	console.log(PDF.loadPDF);
	//PDF.loadPDF(path);
}

function html_Reader(sql,path,cb) {

	function reportify(File,Post) {
		var Xlate = {
			AR: "State0", 	// advisory
			PR: "State1",	// test plan
			RR: "State2",	// test readiness
			TR: "State3",	// test report
			UR: "State4",	// user review
			ER: "State5", 	// independent eval
			MR: "State6",	// memo of understanding
			DR:	"State7",	// developers report
			OR:	"State8",	// operational test & eval
			SR: "State9"	// security report
		};

		if (!File) return Xlate[Post];

		var Script = "JAVASCRIPT:";
		var Query = File.toUpperCase().split("?");
		var Parms = (Query.length>1) ? Query[Query.length-1] : "";
		var Names = Query[0].split("/");
		var Parts = Names[Names.length-1].split(".");
		var Name = unescape(Parts[0]);
		var Type = (Parts.length>1) ? Parts[Parts.length-1] : "";
		var Report = Post;

		if (Query[0].substr(0,Script.length) == Script) return null;

		switch (Type) {
			case "PHP":		// ignore things that dont look like relevant files
			case "HTM":
			case "HTML":
			case "INTEL":
			case "ASP":
			case "ASPX":
				Report = Parms.has("DOCUMENTID=") ? "DR" : null;
				break;

			case "PDF":		// relevant files
			case "DOC":	
			case "DOCX":
			case "TXT":
			case "XLS":
			case "XLSX":
			case "":

				if (Parms) return null;
				if (!Name) return null;

				var isTest = Name.has("TEST");
				var isPlan = Name.has("PLAN") && isTest;
				var isBogus = File.has("/PEOPLE") || Name.has(":");
				var isReport = isTest && !isPlan;
				var isReady = Name.has("ASSESS") || Name.has("READY") || Name.has("READI") || Name.has("EVAL");
				var isEval = Name.has("VERIF") || Name.has("V&V");
				var isOper = Name.has("OPER") || File.has("/WIKI");

				if (isBogus) 	Report = null;
				else
				if (isPlan)		Report = "PR";	
				else
				if (isReady)	Report = "RR";
				else
				if (isEval)		Report = "ER";
				else
				if (isReport)	Report = "TR";
				else
				if (isOper)		Report = "OR";

				break;

			default:

				break;
		}

		return Report ? Xlate[Report] : null;
	}

	sql.query("SELECT * from engines WHERE least(?)",{Name:path, Engine:"html"})
	.on("result", function (eng) {
		var Site = eng.Path, Table = job;
		var rec = {ID:0};
		var filter = eng.Code ? JSON.parse(eng.Code) : null;

		console.info("Queueing "+rec.Path);

		JSDOM.env({
			file	: Site,					// Site that supplies the DOM
			scripts	: [ENV.SCAN],			// Add jQuery & Scanner to the DOM
			done	: function (err, window) {
				var $ = window ? window.$ : null;
				var site = window ? window.location.href : "";

				//console.info("SCAN site "+site+" $="+($?true:false)+" err="+err);

				if (site && $ && !err) {	// scan valid and matched site
					sql.query("SELECT * FROM proxies WHERE LEAST(?) LIMIT 0,1",{Path:site.replace("file://",""),Enabled:true})
					.on("result", function (proxy) {
						console.info("SCANNING "+Site+":"+Table);

						var ids = {0: false},
							path = proxy.Name;

						$("body").find("table."+Table).each( function () {
							$("table",this).each( function () {	// remove nested tables
								//console.log("SCAN removed nested table");
							}).remove();

							if ($("caption",this).length) 
								rec.Caption = $("caption",this).first().text();

							$("tr",this).each( function (tr) {	// derive column ids and data
								var cols = $("td",this).length;

								if (ids["0"]) {	// columns defined so go get data
									$("td",this).each( function (td) {	
										id = (cols==1) ? "info" : ids[td];

										if (filter ? filter[id] : true) 
											rec[id] = $(this).text();

										$("a",this).first().each( function () {	// todo reportify path
											if (filter ? filter[id] : true) 
												rec[id] += "<a href='" + $(this).attr("href") + "'>" + path + "</a>";
										});
									});

									cb(rec);	// retain record
								}
								else {
									$("th",this).each( function (th) {  // use header row for ids if provided
										ids[th] = $(this).text().has(args);
									});

									if (!tr && !ids["0"]) // 1st row gives ids if no header row provided
										$("td",this).each( function (td) {
											ids[td] = $(this).text().has(args);
										});
								}
							});	
						});
					});
				}
				else 
					console.log("http reader error: "+err);
			}
		});
	});
}

function yql_Reader(sql,path,cb) { 
	var 
		select = req.param('select'),
		from = req.param('from'),
		where = req.param('where'),
		query = "select "+select+" from "+from+" where "+where.replace(/\\/g,"/");

	console.info(UTIL.format("%s %s",req.method,query));

	new YQL.exec(query, function (recs) {
		console.info(recs);
		Each( recs, function (n,rec) {
			cb(rec);
		});
	});
}

/*
function db_Reader(sql,path,cb) {
	sql.query("SELECT * FROM ??", path, function (recs) {
		cb(JSON.stringify(recs));
	});
} */
/*
function jpg_Reader(sql,path,cb) {		
} */
/*
function py_Reader(sql,path,cb) {
	try {
		sql.query("UPDATE engines SET ? WHERE least(?)",[
				{Code:FS.readFileSync(path,'utf8')},
				{Name:job, Engine:"python"}]);
	} catch (err) {};
}

function js_Reader(sql,path,cb) {
	try {
		sql.query("UPDATE engines SET ? WHERE least(?)",[
				{Code:FS.readFileSync(path,'utf8')},
				{Name:job, Engine:"js"}]);
	} catch (err) {};

}

function jade_Reader(sql,path,cb) {
	try {
		sql.query("UPDATE engines SET ? WHERE least(?)",[
				{Code:FS.readFileSync(path,'utf8')},
				{Name:job, Engine:"jade"}]);
	} catch (err) {};

}
*/
/*
function idop_Reader(sql,path,cb) {	
	// area contains parms and is used to start the swag workflow
	var env = process.env,
		parms = {
			size: parseFloat(env.SIZE),
			pixels: parseInt(env.PIXELS),
			scale: parseFloat(env.SCALE),
			step: parseFloat(env.STEP),
			range: parseFloat(env.RANGE),
			detects: parseInt(env.DETECTS),
			infile: path,
			outfile: ""
		};

	HACK.workflow(sql, parms, function (chip,dets) {
		cb(dets);
	}); 
}
*/

function readFile(sql, path, cb) {
	var 
		parts = path.split("."),
		type = parts.pop();

	if ( reader = READ.readers[type] )
		reader(sql, path, cb);
	
	else
		cb( null );
}

function sumScores(scores, metrics) {
	var 
		entities = metrics.entities,
		count = metrics.count,
		ids = metrics.ids,
		topics = metrics.topics;
		//dag = metrics.dag;
	
	scores.forEach( score => {
		/*
		if ( targetid = ids.actors[score.actors[score.actors.length-1]] )
			score.ants.forEach( ant => {
				dag.add( ids.actors[ant], targetid, score.sentiment );
			});  */

		/*
		if ( score.level > metrics.level ) {
			metrics.level = score.level;
			metrics.topic = score.topic;
		}  */

		metrics.sentiment += score.sentiment;
		//for (var n=0,rel=score.relevance,N=rel.length; n<N; n++)  if (rel.charAt(n) == "y") metrics.relevance++;

		metrics.relevance += score.relevance;
		metrics.weight += score.weight;
		metrics.agreement += score.agreement;
		
		score.actors.forEach( actor => {
			if ( !entities.addString( "Actor:"+actor ) ) {
				ids.actors[actor] = count.actors++;
				metrics.actors.push(actor);
			}
		});

		score.links.forEach( link => {
			if ( !entities.addString( "Link:"+link ) ) {
				ids.links[link] = count.links++;
				metrics.links.push(link);
			}
		});	
		
	}); 
	
}

function ldaDoc(doc, topics, terms, cb) {	// laten dirichlet doc analysis
	var docs = doc.replace(/\n/gm,"").match( /[^\.!\?]+[\.!\?]+/g );
	cb( LDA( docs , topics||2, terms||2 ) );
}

function anlpDoc(doc, cb) {	// homebrew NER

	var 
		frags = doc.replace(/\n/g,"").match( /[^\.!\?]+[\.!\?]+/g ) || [],
		
		rubric = READ.spellRubric,
		classif = READ.classif,
		paths = READ.paths,
		checker = READ.checker, 
		analyzer = READ.analyzer,
		tokenizer = READ.tokenizer,
		stemmer = READ.stemmer,
		rules = READ.rules,
		lexicon = READ.lexicon,
		tagger = READ.tagger,
		metrics = {
			entities: new ANLP.Trie(false),
			count: {
				links: 0,
				actors: 0
			},
			ids: {
				links: {},
				actors: {}
			},
			actors: [],
			links: [],			
			sentiment: 0,
			relevance: 0,
			agreement: 0,
			weight: 0,
			topics: {},
			level: 0
		},
		
		scores = [],
		// dag: new ANLP.EdgeWeightedDigraph(),
		freqs = new ANLP.TfIdf(),
		topics = metrics.topics;

	frags.forEach( frag => {
		if (frag) {
			var 
				tokens = tokenizer.tokenize(frag),
				sentiment = analyzer.getSentiment(tokens),
				tags = tagger.tag(tokens).taggedWords,
				stems = [],
				relevance = "",
				links = [],
				actor = "",
				actors = [],
				classifs = [],
				agreement = 0,
				weight = 0;

			freqs.addDocument(frag);
			classif.forEach( (cls,n) => classifs[n] = cls.getClassifications(frag) );
			tokens.forEach( token => stems.push( stemmer(token) ) );
			//stems.forEach( stem => relevance += checker.isCorrect(stem) ? "y" : "n" );
			tags.forEach( (tag,n) => tags[n] = tag.tag );

			tags.forEach( (tag,n) => { 
				if ( tag.startsWith("?") || tag.startsWith("NN") ) actor += tokens[n];
				else {
					if ( actor ) { actors.push( actor ); actor = ""; }
					if ( tag.startsWith("VB") ) links.push( tokens[n] ); 
				}
			});
			if ( actor ) actors.push( actor ); 

			var ref = classifs[0][0];
			classifs.forEach( classif => { 
				if ( classif[0].label == ref.label ) agreement++; 
				weight += classif[0].value;
			});

			if ( ref.label in topics ) topics[ref.label] += ref.value; else topics[ref.label] = ref.label;
			
			scores.push({
				pos: tags.join(";"),
				frag: frag,
				classifs: classifs,
				tokens: tokens,
				agreement: agreement / classifs.length,
				weight: weight,
				stems: stems,
				sentiment: sentiment,
				links: links,
				actors: actors,
				relevance: 0
			});
		}
	});

	["DTO", "DTO cash"].forEach( find => {
		freqs.tfidfs( find, (n,score) => scores[n].relevance += score );
	});
	
	sumScores( scores, metrics );	
	//Log(metrics);
	cb(metrics, scores);
}

function snlpDoc(doc,cb) {	// stanford NER
	var 
		frags = doc.replace(/\n/g,"").match( /[^\.!\?]+[\.!\?]+/g ) || [],
		
		stanford = READ.stanford,
		metrics = {
			entities: new ANLP.Trie(false),
			count: {
				links: 0,
				actors: 0
			},
			ids: {
				links: {},
				actors: {}
			},
			actors: [],
			links: [],
			sentiment: 0,
			relevance: 0,
			agreement: 0,
			weight: 0,
			topics: {},
			level: 0
		},
		entities = metrics.entities,
		count = metrics.count,
		ids = metrics.ids,
		topics = metrics.topics,
		//dag = metrics.dag,		
		scores = [], 
		nlps = [],
		done = 0;

		frags.forEach( frag => {
			( async() => {
				var nlp = await stanford.process("en", frag);
				nlps.push( nlp );
				var actors = []; nlp.entities.forEach( ent => actors.push( ent.utteranceText ) );
				if ( nlp.intent in topics ) topics[nlp.intent] += nlp.score; else topics[nlp.intent] = nlp.score;
				
				scores.push({
					classifs: [{value: nlp.score, label: nlp.intent}],
					sentiment: nlp.sentiment.score,
					relevance: 0,
					agreement: 1,
					links: ["related"], // nlp.actions ?
					actors: actors,
					weight: 1
				});
				if ( ++done == frags.length ) {
					sumScores( scores, metrics );
					cb(metrics, nlps);
				}
			}) ();
		});

		if ( !frags.length ) cb(metrics, scores);
}

/*
[
	function cleaner() {	
		return this
				.toUpperCase()
				.replace(/\t/gm,"")
				.replace(/^#* /gm,"")
				.replace(/\n/gm," ")
				.replace(/<BR>/g," ")
				.replace(/\&NBSP;/g," ")
				.replace(/,/g,".")
				.replace(/:/g,".")
				.replace(/;/g,".")
				.replace(/ AND /g,".")
				.replace(/ OR /g,".")
				.replace(/ THEN /g,".")
				.replace(/ IF /g,".")
				.replace(/ BECAUSE /g,".")
				.replace(/ WHEN /g,".")
				.replace(/  /g," ");
	},

	function splitter() {
		return this.match( /[^\.!\?]+[\.!\?]+/g );
	},

	function indexor(score,cb) {
		var rubric = READ.spellRubric,
			classify = READ.classif,
			text = this+"";

		if (text.length > READ.minTextLen)
			SPELL.check( text, function (err,checks) {

				if (!checks || err) checks = [];

				Each(checks, function (n,check) {
					score.Readability -= rubric[check.type];
				});

				//console.log([text, score.Readability, READ.minReadability]);

				if (score.Readability > READ.minReadability)
					text.splitter().each( function (n,frag) {
						//console.log([n,frag]);

						if (frag) 								// discard empties
							if (frag.indexOf("<") < 0) 			// discard html (yes - a stupid filter)
								classify.getClassifications(frag).each( function (m,idx) {
									//console.log([frag,idx.value,idx.label,READ.minRelevance]);
									if (idx.value > READ.minRelevance) 		// discard irrelevant
										score[idx.label] += idx.value;
								});
					});

				cb();
			});
	}
].Extend(String);
*/

READ.config(null);  // must do initial config as ANLP whacks Array prototypes

const { Copy,Each,Log } = require("enum");

//=============== unit tests

/**
@class READER.Unit_Tests_Use_Cases
*/

switch ( process.argv[2] ) { //< unit tests
	case "?":
		Log("unit test with 'node reader.js [R1 || R2 || ...]'");
		break;	
}

// UNCLASSIFIED
