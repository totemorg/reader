// UNCLASSIFIED

/**
Read (index, score, parse, scrape) a variety of document, 
graphic, presentation, and spreadsheet files,  
Ingested text is checked 
for readibility, indexed to the best using NLP training rules.
Documented in accordance with [jsdoc]{@link https://jsdoc.app/}.

@module READER

@requires [enums](https://github.com/totemstan/enum)

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
@requires shp-write
@requires shp
@requires tokml
@requires parse-kml
@requires teseract
@requires geohack

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

// GPU in spaCy supports their ANNs
// https://support.prodi.gy/t/will-a-gpu-make-training-faster/187

// GPU vs CPU
// https://discourse.julialang.org/t/how-much-faster-is-gpu-compare-to-cpu/17533
// https://people.eecs.berkeley.edu/~sangjin/2013/02/12/CPU-GPU-comparison.html
*/

const
	// nodejs bindings
	ENV = process.env,
	CP = require('child_process'),
	FS = require('fs');			// File system

// goofy issue with packages overriding string cause us to init ANLP first
const
	ANLP = require('natural'),				// Natural Language Parsing (Bayes or Logireg)
	TOPICS = ["default", "cartel", "terror", "photons", "os"],
	$ = (A, cb) => {
		const
			N = A.forEach ? A.length : A,
			res = A.forEach ? new Object() : new Array( N );

		if ( A.forEach )
			for (var n=0; n<N; n++) cb( A[n], res );

		else
			for (var n=0; n<N; n++) cb( n, res );
		
		return res;
	},

	spellCheckers = $(TOPICS, (topic,A) => {
		A[topic] = new ANLP.Spellcheck( 
			FS
			.readFileSync( `./nlpconfig/${topic}_corpus.txt`, "utf8" )
			.replace(/^-/g,"").replace(/\n/gm," ").split(" "), 
			true );
	}),
	
	sentimentAnalyzer = new ANLP.SentimentAnalyzer("English", ANLP.PorterStemmer, "pattern");

const 
	// totem
	//HACK = require('geohack'), 			// chipper+detector workflow

	// 3rd party
	//XMLP = require("htmlparser"),			// HTML parser
	//OO = require('office'),				// Open Office parser
	//SPELL = require('teacher'),			// Spell checker - requires service.afterthedeadline.com
	
	JSDOM = require('jsdom'),				// Web site crawler	
	PDFP = require('pdf2json/pdfparser'), 	// PDF parser
	YQL = require('yql'),					// Cooperating site scrapper
	EXCEL = require('node-xlsx'),			// Excel parser
	SNLP = require('node-nlp'), 			// NLP via Stanford NER
	LDA = require('lda'), 					// NLP via Latent Dirichlet Allocation
	XML2JS = require("xml2js"),				// xml to json parser 	
	UNO = require('unoconv'),				// File converter/reader
	  
	// totem modules
	{ Copy,Each,Log,Debug } = require("../enums"),	// basic enumerators
	CHIP = require("../geohack");				// earth chipper

const
	{ Trace, score, readers, nlps } = READ = module.exports = { 
		
	Trace: (msg, ...args) => `read>>>${msg}`.trace( args ),	
		
	config: opts => { // initial config to avoid ANLP Array prototype conflicts
		
		//if (opts) for (var key in opts) READ[key] = opts[key];
		if (opts) Copy(opts,READ,".");

		const { classifiers, trainer, lexicon, sqlThread, paths, stanford, PorterStemmer } = READ;
	
		//READ.tagger = new ANLP.BrillPOSTagger(lexicon,rules);

		classifiers.forEach( (Cls,n) => {	// load/reset pretrained classifiers from save path
			try {
				var cls = classifiers[n] = Cls.restore(JSON.parse(FS.readFileSync(paths.nlpClasssifier+n)));
				Trace(cls.constructor.name, "load from=", paths.nlpClasssifier);
			}
			catch (err) {
				var cls = classifiers[n] = new Cls();
				Trace(cls.constructor.name, "reset from=", paths.nlpClasssifier);				
			}			
		});

		if ( sqlThread && 0 )
			sqlThread( sql => {
				Trace("TRAIN detectors");
				sql.query('SELECT `UseCase` AS doc, `Index` AS topic FROM openv.nlprules', (err,rules) => {
					trainer( err ? [] : rules, true );
				});
			});			
		
		//Trace("define entities");
		if ( stanford ) stanford.addNamedEntityText(["DTO", "CTO", "hawk", "lieutenant", "police officer", "politician", "officer", "suspect", "windows", "OS"]);
	},
		
	topics: TOPICS,
	terms: ["cartel","DTO","CTO","system","weapon","bomb","cats","dogs"],
		
	stanford: new SNLP.NlpManager({ languages: ["en"] }),
	tokenizer: new ANLP.WordTokenizer(),
	stemmer: ANLP.PorterStemmer.stem,
	trie: ANLP.Trie,
	
	spellCheckers: spellCheckers,
	sentimentAnalyzer: sentimentAnalyzer,
		
	classifiers: [ANLP.BayesClassifier, ANLP.LogisticRegressionClassifier],
	rules: new ANLP.RuleSet("./nlpconfig/nlp_pos_rules.txt"),
	lexicon: new ANLP.Lexicon("./nlpconfig/nlp_pos_lexicon.txt", "?"),
	tagger: null,
	dictionary: new ANLP.WordNet(),
		
	trainer: (rules,test) => {		// train all classifiers
		var 
			recs = 0;
		
		const
			{ topics,terms,stanford, classifiers, paths, trials } = READ;

		if ( stanford ) {
			rules.forEach( rule => {
				//Trace("add doc", rule );
				stanford.addDocument( "en", rule.doc, rule.topic );
			});
			
			( async() => {
				Trace("train StanfordCRF");
				await stanford.train();
				stanford.save();
			}) ();			
		}

		rules.forEach( rule => {
			classifiers.forEach( cls => {
				//Trace("add doc", cls.constructor.name, rule);
				cls.addDocument(rule.doc, rule.topic);
			});
		});

		classifiers.forEach( (cls,n) => {
			Trace("train", cls.constructor.name);
			cls.train();

			if ( false && paths.nlpClasssifier ) {
				cls.save(paths.nlpClasssifier+n, err => Log( err || `${cls.constructor.name} saved` ) );
			}
		});

		if ( trials && test ) {			
			if ( stanford ) {
				trials.forEach( trial => {
					( async() => {
						var test = await stanford.process("en", trial );
						Trace("StanfordCRF", trial, "=>", test.intent);
					}) ();
				});
			}
			
			classifiers.forEach( (cls,n) => {
				trials.forEach( trial => {
					Trace(cls.constructor.name, trial, "=>", cls.classify(trial));
				});
			});
			
			Trace("LDA", "...", "=>", LDA(trials.join("").fragment(), 2, 5, ["en"]) );
		}
	},
		
	/**
	*/
	scanner: (doc,topic,threshold,cb) => {
		const 
			{random} = Math,
			{ freqAnalyzer,terms,topics,spellRubric,classifiers,paths,checker,spellCheckers,sentimentAnalyzer,tokenizer,stemmer,rules,lexicon,tagger,dictionary} = READ,
			spellChecker = spellCheckers[topic],
			tokens = tokenizer.tokenize(doc),
			frags = doc.fragment(),   // .split("."),
			idf = new freqAnalyzer(),
			score = {
				Sentiment: sentimentAnalyzer.getSentiment(tokens),
				Readability: 0,
				LDA: LDA( frags , 2||topics.length, 5||terms.length, ["en"] ),
				Freqs: {},
				Topic: 0
			},
			{ Freqs } = score;
						
		//Log( tokens );
		//Log(frags);
		
		Trace("SCAN", topic, threshold);
		
		tokens.forEach( word => {
			score.Readability += spellChecker.isCorrect(word) ? 1 : -2;
		});

		frags.forEach( frag => {
			if (frag) {								// discard empties
				idf.addDocument(frag);
				
				classifiers.forEach( cls => {
					const name = cls.constructor.name;
					
					cls.getClassifications(frag).forEach( (idx,m) => {
						//Trace( name, frag, idx);
						//if ( ! (idx.label in score) ) score[idx.label] = 0;
						if ( idx.label == topic ) if ( idx.value >= threshold ) score.Topic++; 
						//score[idx.label] += idx.value;
					});
				});

				/*
				if ( sentimentAnalyzer ) score.Sentiment = sentimentAnalyzer.getSentiment(tokens);
				if ( tagger ) score.tags = tagger.tag(tokens).taggedWords;

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
				flushActor(dict); */
			}
		});

		terms.forEach( term => {
			Freqs[term] = 0;
			idf.tfidfs( term, (n,measure) => Freqs[term] += measure );
		});
		
		cb(score);
	},

	/**
	*/
		
	readers: {
		//idop	: idop_Reader,
		
		json	: json_Reader,
		
		jpg		: image_Reader,
		png		: image_Reader,
		nitf	: image_Reader,
		ico		: image_Reader,
		
		jpgx	: ocr_Reader,
		pngx	: ocr_Reader,
		
		xls		: xls_Reader,
		xlsx	: xls_Reader,
		
		txt		: txt_Reader,	
		txtx	: nlp_Reader,
		
		html	: html_Reader,
		
		yql		: yql_Reader,
		odt		: odt_Reader,
		odp		: odp_Reader,
		ods		: ods_Reader,
		pdf		: pdf_Reader,
		xml		: xml_Reader,
		
		aoi		: aoi_Reader
	},			
	enabled : true,
	paths: {
		nlpCorpus: "./nlpconfig/nlp_corpus.txt",
		nlpClasssifier: "", // "./nlp_classifier.txt",
		nlpRuleset: "./nlpconfig/nlp_pos_rules.txt",
		nlpLexicon: "./nlpconfig/nlp_pos_lexicon.txt"
	},
	trials 	: [  // nlp trials
'Windows sucks.',
'circular polarized beams are my favorite.',
'Most regression algorithims are not experimental.',
'hyperspectral data is great for detecting some things.',
'Milenio sent some money to a DTO and Fred Smiley.',
'Milenio conspired with Sinola to threaten and kill and butcher Dr Smiley.'
	],
	freqAnalyzer: ANLP.TfIdf,
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

function aoi_Reader(path,cb) {
	
	sqlThread( sql => {
		CHIP.workflow(sql, {
			detName: det.Name.replace(/ /g,"_"),
			chanName: det.channel,
			size: det.Feature,
			pixels: det.Pixels,
			scale: det.Pack,
			step: det.SizeStep,
			range: det.SizeRange,
			detects: det.Hits,
			infile: det.infile,
			outfile: "/rroc/data/giat/swag/jobs",
			job: {
				client: req.client,
				class: "detect",
				name: det.Name,
				link: det.Name.tag("a",{href:"/swag.view?goto=Detectors"}),
				qos: req.profile.QoS,
				priority: 1
			}
		});	
	});
}

function xls_Reader(path,cb) {
	const 
		[file,name] = path.split(":"),
		sheets = EXCEL.parse(file);

	if (sheets) 
		sheets.forEach( (sheet, n) => {  // sheet - no formulas allowed
			if ( !name || name==sheet.name ) {
				const 
					vars = new Array(sheet.maxCol),
					data = sheet.data,
					recs = [];

				data.forEach( (row, j) => {
					const
						rec = {ID:j, sheet: sheet.name};

					if ( j ) {
						row.forEach( (cell, i) => rec[ vars[i] ] = cell );
						recs.push(rec);
					}
					
					else   // 1st record is the header containing field names
						row.forEach( (cell, i) => vars[i] = cell );
				});
				
				cb(recs);
			}
		});

	cb(null);
}

function nlp_Reader(path,cb) {
	path.streamFile( {}, buff => score( buff, nlps, metrics => cb( metrics ) ) );
}
								 
function txt_Reader(path,cb) {
	path.streamFile( {}, buff => cb( buff ) );
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
	var 
		file = path.split("/").pop(),
		[x,name,type] = file.match(/(.*)\.(.*)/) || [],
		save = "";
	
	CP.exec( `pdf2json -f ${path} -o ./tmp`, (err,out) => {
		//Log(err,out);
		if ( err )
			cb( err );
		
		else
			FS.readFile( `./tmp/${name}.json`, "utf8", (err,txt) => {
				//Log( err );
				if ( err )
					cb( err );
				
				else {
					var res = JSON.parse(txt);
					//g( Object.keys(res.formImage) );
					res.formImage.Pages.forEach( page => {
						//Trace( "page", Object.keys(page) );
						page.Texts.forEach( text => {
							//Trace( "text", Object.keys(text) );
							text.R.forEach( R => {
								save += R.T + " ";
							});
						});
					});

					cb( unescape(save) );
				}
			});
	});
	/*
	var PDF = new PDFP();

	console.log("pdf reader");
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
	*/
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

function json_Reader(path,cb) {
	path.streamFile( {}, buff => cb( buff) );
}

function image_Reader(path,cb) {
	const
		{ jimp } = READ;
	
	jimp.read( "."+path )
	.then( img => { 
		//Trace("image", img.bitmap.height, img.bitmap.width);
		img.readPath = path;
		cb( img ); 
		return img; 
	} )
	.catch( err => cb(null) );	
}

function ocr_Reader(path,cb) {
	const
		src = "."+path;
	
	CP.exec( `tesseract ${src} stdout`, (err,out) => {
		cb( err || out );
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

[
	function fragment() {
		return this.replace(/\n/gm,"").match( /[^\.!\?]+[\.!\?]+/g ) || [this];
	}
	/*
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
	}, */

	/*
	function splitter() {
		return this.match( /[^\.!\?]+[\.!\?]+/g );
	}, */

	/*
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
	*/
].Extend(String);

//READ.config();  // Must config before enum to avoid ANLP array prototype collisions

//=============== unit tests

/**
@class READER.Unit_Tests_Use_Cases
*/

switch ( process.argv[2] ) { //< unit tests
	case "X?":
	case "?":
		Trace("unit test with 'node reader.js [X$ || X1 || ...]'");
		break;	
		
	case "X$":
		Debug(READ);
		break;
		
	case "X1":
	 	pdf_Reader("./stores/ocrTest01.pdf", txt => Log(txt) );
		break;
}

// UNCLASSIFIED
