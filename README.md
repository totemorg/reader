# READER

**READER** will index (parse, scrape, etc) a variety of document, graphics, presentation, and spreadsheet files 
that were uploaded into Totem,  Ingested text is checked for readibility, indexed to the best using 
[NLP training rules](/nlprules.view), then reflected into the [file stores](/files.view).

## Suport File Types

### WEB files

	html	- Web site
	rss		- News feed
	idop	- NTM imagery
		
### Document files

	bib      - BibTeX [.bib]
	doc      - Microsoft Word 97/2000/XP [.doc]
	doc6     - Microsoft Word 6.0 [.doc]
	doc95    - Microsoft Word 95 [.doc]
	docbook  - DocBook [.xml]
	docx     - Microsoft Office Open XML [.docx]
	docx7    - Microsoft Office Open XML [.docx]
	fodt     - OpenDocument Text (Flat XML) [.fodt]
	html     - HTML Document (OpenOffice.org Writer) [.html]
	latex    - LaTeX 2e [.ltx]
	mediawiki - MediaWiki [.txt]
	odt      - ODF Text Document [.odt]
	ooxml    - Microsoft Office Open XML [.xml]
	ott      - Open Document Text [.ott]
	pdb      - AportisDoc (Palm) [.pdb]
	pdf      - Portable Document Format [.pdf]
	psw      - Pocket Word [.psw]
	rtf      - Rich Text Format [.rtf]
	sdw      - StarWriter 5.0 [.sdw]
	sdw4     - StarWriter 4.0 [.sdw]
	sdw3     - StarWriter 3.0 [.sdw]
	stw      - Open Office.org 1.0 Text Document Template [.stw]
	sxw      - Open Office.org 1.0 Text Document [.sxw]
	text     - Text Encoded [.txt]
	txt      - Text [.txt]
	uot      - Unified Office Format text [.uot]
	vor      - StarWriter 5.0 Template [.vor]
	vor4     - StarWriter 4.0 Template [.vor]
	vor3     - StarWriter 3.0 Template [.vor]
	xhtml    - XHTML Document [.html]
### Graphics files

	bmp      - Windows Bitmap [.bmp]
	emf      - Enhanced Metafile [.emf]
	eps      - Encapsulated PostScript [.eps]
	fodg     - OpenDocument Drawing (Flat XML) [.fodg]
	gif      - Graphics Interchange Format [.gif]
	html     - HTML Document (OpenOffice.org Draw) [.html]
	jpg      - Joint Photographic Experts Group [.jpg]
	met      - OS/2 Metafile [.met]
	odd      - OpenDocument Drawing [.odd]
	otg      - OpenDocument Drawing Template [.otg]
	pbm      - Portable Bitmap [.pbm]
	pct      - Mac Pict [.pct]
	pdf      - Portable Document Format [.pdf]
	pgm      - Portable Graymap [.pgm]
	png      - Portable Network Graphic [.png]
	ppm      - Portable Pixelmap [.ppm]
	ras      - Sun Raster Image [.ras]
	std      - OpenOffice.org 1.0 Drawing Template [.std]
	svg      - Scalable Vector Graphics [.svg]
	svm      - StarView Metafile [.svm]
	swf      - Macromedia Flash (SWF) [.swf]
	sxd      - OpenOffice.org 1.0 Drawing [.sxd]
	sxd3     - StarDraw 3.0 [.sxd]
	sxd5     - StarDraw 5.0 [.sxd]
	sxw      - StarOffice XML (Draw) [.sxw]
	tiff     - Tagged Image File Format [.tiff]
	vor      - StarDraw 5.0 Template [.vor]
	vor3     - StarDraw 3.0 Template [.vor]
	wmf      - Windows Metafile [.wmf]
	xhtml    - XHTML [.xhtml]
	xpm      - X PixMap [.xpm]
### Presentation files

	bmp      - Windows Bitmap [.bmp]
	emf      - Enhanced Metafile [.emf]
	eps      - Encapsulated PostScript [.eps]
	fodp     - OpenDocument Presentation (Flat XML) [.fodp]
	gif      - Graphics Interchange Format [.gif]
	html     - HTML Document (OpenOffice.org Impress) [.html]
	jpg      - Joint Photographic Experts Group [.jpg]
	met      - OS/2 Metafile [.met]
	odg      - ODF Drawing (Impress) [.odg]
	odp      - ODF Presentation [.odp]
	otp      - ODF Presentation Template [.otp]
	pbm      - Portable Bitmap [.pbm]
	pct      - Mac Pict [.pct]
	pdf      - Portable Document Format [.pdf]
	pgm      - Portable Graymap [.pgm]
	png      - Portable Network Graphic [.png]
	potm     - Microsoft PowerPoint 2007/2010 XML Template [.potm]
	pot      - Microsoft PowerPoint 97/2000/XP Template [.pot]
	ppm      - Portable Pixelmap [.ppm]
	pptx     - Microsoft PowerPoint 2007/2010 XML [.pptx]
	pps      - Microsoft PowerPoint 97/2000/XP (Autoplay) [.pps]
	ppt      - Microsoft PowerPoint 97/2000/XP [.ppt]
	pwp      - PlaceWare [.pwp]
	ras      - Sun Raster Image [.ras]
	sda      - StarDraw 5.0 (OpenOffice.org Impress) [.sda]
	sdd      - StarImpress 5.0 [.sdd]
	sdd3     - StarDraw 3.0 (OpenOffice.org Impress) [.sdd]
	sdd4     - StarImpress 4.0 [.sdd]
	sxd      - OpenOffice.org 1.0 Drawing (OpenOffice.org Impress) [.sxd]
	sti      - OpenOffice.org 1.0 Presentation Template [.sti]
	svg      - Scalable Vector Graphics [.svg]
	svm      - StarView Metafile [.svm]
	swf      - Macromedia Flash (SWF) [.swf]
	sxi      - OpenOffice.org 1.0 Presentation [.sxi]
	tiff     - Tagged Image File Format [.tiff]
	uop      - Unified Office Format presentation [.uop]
	vor      - StarImpress 5.0 Template [.vor]
	vor3     - StarDraw 3.0 Template (OpenOffice.org Impress) [.vor]
	vor4     - StarImpress 4.0 Template [.vor]
	vor5     - StarDraw 5.0 Template (OpenOffice.org Impress) [.vor]
	wmf      - Windows Metafile [.wmf]
	xhtml    - XHTML [.xml]
	xpm      - X PixMap [.xpm]
### Spreadsheet files

	csv      - Text CSV [.csv]
	dbf      - dBASE [.dbf]
	dif      - Data Interchange Format [.dif]
	fods     - OpenDocument Spreadsheet (Flat XML) [.fods]
	html     - HTML Document (OpenOffice.org Calc) [.html]
	ods      - ODF Spreadsheet [.ods]
	ooxml    - Microsoft Excel 2003 XML [.xml]
	ots      - ODF Spreadsheet Template [.ots]
	pdf      - Portable Document Format [.pdf]
	pxl      - Pocket Excel [.pxl]
	sdc      - StarCalc 5.0 [.sdc]
	sdc4     - StarCalc 4.0 [.sdc]
	sdc3     - StarCalc 3.0 [.sdc]
	slk      - SYLK [.slk]
	stc      - OpenOffice.org 1.0 Spreadsheet Template [.stc]
	sxc      - OpenOffice.org 1.0 Spreadsheet [.sxc]
	uos      - Unified Office Format spreadsheet [.uos]
	vor3     - StarCalc 3.0 Template [.vor]
	vor4     - StarCalc 4.0 Template [.vor]
	vor      - StarCalc 5.0 Template [.vor]
	xhtml    - XHTML [.xhtml]
	xls      - Microsoft Excel 97/2000/XP [.xls]
	xls5     - Microsoft Excel 5.0 [.xls]
	xls95    - Microsoft Excel 95 [.xls]
	xlt      - Microsoft Excel 97/2000/XP Template [.xlt]
	xlt5     - Microsoft Excel 5.0 Template [.xlt]
	xlt95    - Microsoft Excel 95 Template [.xlt]

## Installation

Clone [**READER** file readers](https://github.com/totemstan/reader) || [COE](https://sc.appdev.proj.coe/acmesds/reader) || [SBU](https://gitlab.west.nga.ic.gov/acmesds/reader) into your PROJECT/reader folder.   

## Requires

[ENUM standard enumerators](https://github.com/totemstan/enum) || [COE](https://sc.appdev.proj.coe/acmesds/enum) || [SBU](https://gitlab.west.nga.ic.gov/acmesds/enum).   

## Manage 

	npm test [ ? || R1 || R2 || ...]	# Unit test
	npm run [ edit || start ]			# Configure environment
	npm run [ prmprep || prmload ]		# Revise PRM
	
## Usage

Require, configure and start the **READER**:
	
	var READ = require("reader");
	
	READ.config({
		key: value, 						// set key
		"key.key": value, 					// indexed set
		"key.key.": value					// indexed append
	}, function (err) {
		console.log( err ? "something evil is lurking" : "look mom - Im running!");
	});

where [its configuration keys](http://totem.hopto.org/shares/prm/reader/index.html) || [COE](https://totem.west.ile.nga.ic.gov/shares/prm/reader/index.html) || [SBU](https://totem.nga.mil/shares/prm/reader/index.html)
follow the [ENUM deep copy conventions](https://github.com/totemstan/enum) || [COE](https://sc.appdev.proj.coe/acmesds/enum) || [SBU](https://gitlab.west.nga.ic.gov/acmesds/enum).

## Contacting, Contributing, Following

Feel free to [submit and status TOTEM issues](http://totem.hopto.org/issues.view) || [COE](https://totem.west.ile.nga.ic.gov/issues.view) || [SBU](https://totem.nga.mil/issues.view), [contribute TOTEM notebooks](http://totem.hopto.org/shares/notebooks/) || [COE](https://totem.west.ile.nga.ic.gov/shares/notebooks/) || [SBU](https://totem.nga.mil/shares/notebooks/),
[inspect TOTEM requirements](http://totem.hopto.org/reqts.view) || [COE](https://totem.west.ile.nga.ic.gov/reqts.view) || [SBU](https://totem.nga.mil/reqts.view), [browse TOTEM holdings](http://totem.hopto.org/) || [COE](https://totem.west.ile.nga.ic.gov/) || [SBU](https://totem.nga.mil/), 
or [follow TOTEM milestones](http://totem.hopto.org/milestones.view) || [COE](https://totem.west.ile.nga.ic.gov/milestones.view) || [SBU](https://totem.nga.mil/milestones.view).


## License

[MIT](LICENSE)
