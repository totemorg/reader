// UNCLASSIFIED

/**
@module reader
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

References:
// https://towardsdatascience.com/a-comparison-between-spacy-ner-stanford-ner-using-all-us-city-names-c4b6a547290
// https://github.com/explosion/spacy-stanfordnlp
// https://github.com/explosion/spaCy/issues/259
// https://www.novetta.com/2018/08/evaluating-solutions-for-named-entity-recognition/
// https://www.datacamp.com/community/blog/spacy-cheatsheet
// https://towardsdatascience.com/a-comparison-between-spacy-ner-stanford-ner-using-all-us-city-names-c4b6a547290
// https://towardsdatascience.com/a-review-of-named-entity-recognition-ner-using-automatic-summarization-of-resumes-5248a75de175
// https://blog.exsilio.com/all/accuracy-precision-recall-f1-score-interpretation-of-performance-measures/
// https://en.wikipedia.org/wiki/Precision_and_recall
// https://nlp.stanford.edu/software/CRF-NER.html

// https://sites.cs.ucsb.edu/~wychen/publications/plda-aaim09.pdf
// https://bcatctr.github.io/paraLDA/

// GPU in spaCy
// https://support.prodi.gy/t/will-a-gpu-make-training-faster/187

// GPU vs CPU
// https://discourse.julialang.org/t/how-much-faster-is-gpu-compare-to-cpu/17533
// https://people.eecs.berkeley.edu/~sangjin/2013/02/12/CPU-GPU-comparison.html
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

var READ = module.exports = { 
	config: opts => { // initial config to avoid ANLP Array prototype conflicts
		
		if (opts) for (var key in opts) READ[key] = opts[key];
		
		var
			Log = console.log,
			paths = READ.paths,
			Stanford = SNLP.NlpManager,
			stanford = READ.stanford = new Stanford({ languages: ["en"] }),

			Checker = ANLP.Spellcheck,
			Classifiers = [ANLP.BayesClassifier, ANLP.LogisticRegressionClassifier],
				
			Trie = ANLP.Trie,
			Stemmer = ANLP.PorterStemmer,
			Analyzer = ANLP.SentimentAnalyzer,
			Tokenizer = ANLP.WordTokenizer, //ANLP.WordTokenizer

			corpus = FS.readFileSync( paths.nlpCorpus, "utf8" ).replace(/^-/g,"").replace(/\n/gm," ").split(" ");

		var				
			checker = READ.checker = new ANLP.Spellcheck( corpus, true ),
			analyzer = READ.analyzer = new Analyzer("English", Stemmer, "pattern"),
			tokenizer = READ.tokenizer = new Tokenizer(),
			stemmer = READ.stemmer = Stemmer.stem,

			rules = READ.rules = new ANLP.RuleSet(paths.nlpRuleset),
			lexicon = READ.lexicon = new ANLP.Lexicon(paths.nlpLexicon, "?"),
			dict = READ.dictionary = new ANLP.WordNet(),
			tagger = READ.tagger = new ANLP.BrillPOSTagger(lexicon,rules);

		var classifiers = READ.classifiers = [];
		Classifiers.forEach( (Cls,n) => {	// load/reset pretrained classifiers from save path
			try {
				var cls = classifiers[n] = Cls.restore(JSON.parse(FS.readFileSync(paths.nlpClasssifier+n)));
				Log("nlp load ", cls.constructor.name, " from=", paths.nlpClasssifier);
			}
			catch (err) {
				var cls = classifiers[n] = new Cls();
				Log("nlp reset ", cls.constructor.name, " from=", paths.nlpClasssifier);
			}			
		});

		stanford.addNamedEntityText(["DTO", "CTO", "hawk", "lieutenant", "police officer", "politician", "officer", "suspect", "windows", "OS"]);
	},
	train: rules => {		// train all classifiers
		var 
			recs = 0,
			stanford = READ.stanford,
			classifiers = READ.classifiers,
			paths = READ.paths;

		rules.forEach( rule => {
			//Log("nlp add ner");
			stanford.addDocument( "en", rule.Usecase, rule.Index );

			classifiers.forEach( cls => {
				//Log("nlp add mix", cls.constructor.name);
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
					//Log("nlp test", test);
				}) ();
			}

			classifiers.forEach( (cls,n) => {
				Log("nlp train ", cls.constructor.name);
				cls.train();

				if ( paths.nlpClasssifier ) {
					cls.save(paths.nlpClasssifier+n, err => Log( err || `${cls.constructor.name} saved` ) );
				}
			});

			if ( trials = READ.trials) 
				classifiers.forEach( (cls,n) => {
					trials.forEach( trial => {
						Log(trial, cls.constructor.name, "=>", cls.classify(trial));
					});
				});
		}			
	},
	score: 	( doc, methods, cb ) => {	// callback cb(metrics)
		function sumScores(metrics) {	// summarize per doc metrics
			var 
				entities = metrics.entities,
				count = metrics.count,
				scores = metrics.scores,
				ids = metrics.ids,
				topics = metrics.topics;
				//dag = metrics.dag;

			scores.forEach( score => {
				metrics.sentiment += score.sentiment;
				metrics.relevance += score.relevance;
				metrics.agreement += score.agreement;
			}); 
		}

		var 
			docs = doc.replace(/\n/g,"").match( /[^\.!\?]+[\.!\?]+/g ) || [],
			scored = 0,
			lda = {topics: 3, terms: 2},
			metrics = {
				// dag: new ANLP.EdgeWeightedDigraph(),
				lda: LDA( docs, lda.topics, lda.terms ),
				freqs: READ.docFreqs,
				entity: {
					topics: new READ.docTrie(false),
					actors: new READ.docTrie(false)
				},					
				ids: {
					topics: 0,
					actors: 0
				},
				topics: {},
				actors: {},
				sentiment: 0,
				relevance: 0,
				agreement: 0,
				scores: [],
				level: 0
			},
			scores = metrics.scores,
			freqs = metrics.freqs;
			
		//Log("score", docs, methods);
		docs.forEach( doc => {
			if (doc) {	// have a doc to score
				freqs.addDocument(doc);	
				methods.forEach( nlp => {
					if (nlp) 
						nlp( doc, metrics, score => {	// score using nlp method
							scores.push( score );
							if ( ++scored == docs.length ) {	// scored all docs so summarize metrics
								["DTO", "DTO cash"].forEach( word => {
									freqs.tfidfs( word, (n,freq) => {
										if ( score = scores[n] ) score.relevance += freq;
									});
								});

								sumScores( metrics );	
								cb( metrics );
							}

							else
							if (scored > docs.length) // no docs
								cb( metrics );
						});
					
					else
						Log("nlp ignoring method");
				});
			}

			else 
				scored++;
		});
	},	
	readers: {
			//idop	: idop_Reader,
			//jpg		: jpg_Reader,
			//py		: py_Reader,
			//js		: js_Reader,
			//db		: db_Reader,
			//jade	: jade_Reader,
			xls	: xls_Reader,
			xlsx: xls_Reader,
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
	enabled : true,
	nlps: {
		mix: mixNLP,
		ner: nerNLP
	},
	paths: {
		nlpCorpus: "./nlp_corpus.txt",
		nlpClasssifier: "", // "./nlp_classifier.txt",
		nlpRuleset: "./nlp_pos_rules.txt",
		nlpLexicon: "./nlp_pos_lexicon.txt"
	},
	trials 	: false ?  [  // nlp trials
'Windows sucks.',
'circular polarized beams are my favorite.',
'Most regression algorithims are not experimental.',
'hyperspectral data is great for detecting some things.',
'Milenio sent some money to a DTO and Fred Smiley.',
'Milenio conspired with Sinola to threaten and kill and butcher Dr Smiley.'
	] : null,
	docFreqs: new ANLP.TfIdf(),
	docTrie: ANLP.Trie,
	minTextLen : 10,				// Min text length to trigger indexing
	minReadability : -9999,			// Min relevance score to trigger ANLP
	minRelevance: 0.0, 				// Min ANLP relevance to tripper intake
	spellRubric: {
		"spelling": 3,
		"suggestion": 1,
		"grammar": 2
	}
};

/*
function ldaNLP(doc, topics, terms, cb) {	// laten dirichlet doc analysis
	var docs = doc.replace(/\n/gm,"").match( /[^\.!\?]+[\.!\?]+/g );
	cb( LDA( docs , topics||2, terms||2 ) );
}
*/

function mixNLP(doc, metrics, cb) {	// mixed (max entropy, logistic, naviave) NLP

	function flushActor( dict ) {
		if ( actor )
			if ( !entity.actors.addString( actor ) ) {
				var
					isPhone = actor.match(/^[0-9\-]*/)[0],
					isEmail = actor.match(/(.*)\@(.*)/),
					isCartel = actor.match(/(.*)\[(.*)\]$/) || actor.match("cartel"),
					type = isPhone ? "phone" : isEmail ? "email" : isCartel ? "cartel" : "";
				
				if ( !type && dict )
					dict.lookup(actor, recs => {
						recs.forEach( rec => {
							if ( rec.def.match("city") || rec.def.match("state") || rec.def.match("republic" ) ) type = "place";
						});
					});
				
				if ( !type ) type = (random()<0.5) ? "bHat" : "wHat";
				
				actors[actor] = {id: ids.actors++, type: type};
				
				Log( actor, actors[actor] );
			}
		
		actor = "";
	}
		
	const {random} = Math;
	
	var 
		rubric = READ.spellRubric,
		classifiers = READ.classifiers,
		paths = READ.paths,
		checker = READ.checker, 
		analyzer = READ.analyzer,
		tokenizer = READ.tokenizer,
		stemmer = READ.stemmer,
		rules = READ.rules,
		lexicon = READ.lexicon,
		tagger = READ.tagger,
		dict = READ.dictionary,
		entity = metrics.entity,
		topics = metrics.topics,
		actors = metrics.actors,
		ids = metrics.ids;
	
	var 
		tokens = tokenizer.tokenize(doc),
		sentiment = analyzer.getSentiment(tokens),
		tags = tagger.tag(tokens).taggedWords,
		stems = [],
		relevance = "",
		actor = "",
		classifs = [],
		agreement = 0;

	classifiers.forEach( (cls,n) => {
		Log("nlp get class", cls.constructor.name, cls.theta);
		classifs[n] = cls.getClassifications(doc);
	});
	tokens.forEach( token => stems.push( stemmer(token) ) );
	//stems.forEach( stem => relevance += checker.isCorrect(stem) ? "y" : "n" );
	tags.forEach( (tag,n) => tags[n] = tag.tag );

	tags.forEach( (tag,n) => {  // POS analysis
		if ( tag.startsWith("?") || tag.startsWith("NN") ) 
			actor += tokens[n];

		else 
			flushActor(dict);
		
		//else
		//if ( tag.startsWith("VB") ) topics.push( tokens[n] ); 
	});
	flushActor(dict);

	var topic = classifs[0][0].label, weight = 0;
	classifs.forEach( classif => { 
		if ( classif[0].label == topic ) agreement++; 
		weight += classif[0].value;
	});

	if ( !entity.topics.addString(topic) ) 
		topics[topic] = {id: ids.topics++, weight: weight}; 
	
	else
		topics[topic].weight += weight;
			
	
	//if ( ref.label in topics ) topics[ref.label] += ref.value; else topics[ref.label] = ref.value;

	//Log(frag, sentiment);
	cb({
		pos: tags.join(";"),
		classifs: classifs,
		tokens: tokens,
		agreement: agreement / classifs.length,
		stems: stems,
		sentiment: sentiment,
		relevance: 0
	});
}

function nerNLP(doc, metrics, cb) {	// stanford NER
	var 
		stanford = READ.stanford,
		entity = metrics.entity,
		actors = metrics.actors,
		topics = metrics.topics,
		ids = metrics.ids;

	( async() => {
		var stats = await stanford.process("en", doc);
		
		stats.entities.forEach( ent => {
			Log("nlp entity",ent);
			if ( actor = ent.utteranceText )
				if ( !entity.actors.addString( actor) ) 
					actors[actor] = {id: ids.actors++, type: "tbd"};
			
			//actors.push( ent.utteranceText ) 
		});
		
		if ( topic = stats.intent )		
			if ( !entity.topics.addString( topic) ) 
				topics[topic] = {id: ids.topics++, weight: stats.score}; 
		
			else
				topics[topic].weight += stats.score; 

		cb({
			classifs: [{value: stats.score, label: stats.intent}],
			sentiment: stats.sentiment.score,
			relevance: 0,
			agreement: 1,
			stats: stats
		});
	}) ();
}
		
function xls_Reader(path,cb) {
	var 
		sheets = EXCEL.parse(path);

	if (sheets) 
		sheets.forEach( function (sheet, n) {  // sheet - no formulas allowed
			var 
				vars = new Array(sheet.maxCol),
				data = sheet.data;

			data.forEach( function (row, j) {
				var
					rec = new Object({ID:j, sheet: sheet.name});

				if ( j ) {
					row.forEach( function (cell, i) {
						rec[vars[i]] = cell;
					});					
					cb(rec);
				}

				else   // 1st record is the header containing field names
					row.forEach( function (cell, i) {
						vars[i] = cell;
					});
			});
		});

	cb(null);
}

function txt_Reader(path,cb) {
	FS.readFile( path, 'utf8', (err,txt) => {
		if ( !err ) cb({ doc: txt });
		cb( null );
	});
}

function odp_Reader(path,cb) {	
}

function ods_Reader(path,cb) {	
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
				cb(null);
			});		
		});
	}); 
}

function odt_Reader(path,cb) {	

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
						cb({doc: text});
					}); }); }); });
					
					cb(null);
				});					
			});
		}); 
}

function xml_Reader(path,cb) { 
	FS.readFile(path,'utf-8', function (err,data) {
		XML2JS.parseString(data, function (err,json) {
			for (var n in json) console.log(json);
		});
	});
}

function pdf_Reader(path,cb) {
	var PDF = new PDFP();

	console.log("pdfrdr");
	PDF.on("pdfParser_dataReady", function(evtData) {
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

			cb({doc:text});
		}
		
		else
			cb(null);
	});
	
	PDF.on("pdfParser_dataError", function(evtData) {
		console.log("PDF ERROR "+evtData.data);
	});

	console.log("pdf",path);
	console.log(PDF.loadPDF);
	PDF.loadPDF(path);	// all attempts fail
}

function html_Reader(path,cb) {

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

	sql.query("SELECT * from app.engines WHERE least(?)",{Name:path, Engine:"html"})
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
						
						cb(null);
					});
				}
				else 
					console.log("http reader error: "+err);
			}
		});
	});
}

function yql_Reader(path,cb) { 
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
		cb(null);
	});
}

/*
function db_Reader(path,cb) {
	sql.query("SELECT * FROM ??", path, function (recs) {
		cb(JSON.stringify(recs));
	});
} */
/*
function jpg_Reader(path,cb) {		
} */
/*
function py_Reader(path,cb) {
	try {
		sql.query("UPDATE engines SET ? WHERE least(?)",[
				{Code:FS.readFileSync(path,'utf8')},
				{Name:job, Engine:"python"}]);
	} catch (err) {};
}

function js_Reader(path,cb) {
	try {
		sql.query("UPDATE engines SET ? WHERE least(?)",[
				{Code:FS.readFileSync(path,'utf8')},
				{Name:job, Engine:"js"}]);
	} catch (err) {};

}

function jade_Reader(path,cb) {
	try {
		sql.query("UPDATE engines SET ? WHERE least(?)",[
				{Code:FS.readFileSync(path,'utf8')},
				{Name:job, Engine:"jade"}]);
	} catch (err) {};

}
*/
/*
function idop_Reader(path,cb) {	
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

function readFile(path, cb) {
	var 
		parts = path.split("."),
		type = parts.pop();

	if ( reader = READ.readers[type] )
		reader(path, cb);
	
	else
		cb( null );
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

READ.config();  // Must config before enum to avoid ANLP array prototype collisions

const { Copy,Each,Log } = require("enum");

//=============== unit tests

/**
@class READER.Unit_Tests_Use_Cases
*/

switch ( process.argv[2] ) { //< unit tests
	case "?":
		Log("unit test with 'node reader.js [R1 || R2 || ...]'");
		break;	
		
	case "R1":
	 	pdf_Reader("./stores/ocrTest01.pdf", txt => Log(txt) );
		break;
}

// UNCLASSIFIED
