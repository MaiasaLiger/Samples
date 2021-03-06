﻿/*************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
* Copyright 2014 Adobe
* All Rights Reserved.
*
* NOTICE: Adobe permits you to use, modify, and distribute this file in
* accordance with the terms of the Adobe license agreement accompanying
* it. If you have received this file from a source other than Adobe,
* then your use, modification, or distribution of it requires the prior
* written permission of Adobe. 
**************************************************************************/

//------------------------------------------------------------------------------
// Globals
//------------------------------------------------------------------------------
var gProgressBar = null;
var gLib = null;
//
var gApplySuccessful = false


//------------------------------------------------------------------------------
// Initialize PlugPLugExternal lib
// Allows us to dispatch CEP Events
//------------------------------------------------------------------------------

try {
	var xLib = new ExternalObject("lib:\PlugPlugExternalObject")
} catch(e) {
	alert(e);
}
blockRefresh();


//------------------------------------------------------------------------------
// Start the progress bar and creates dissolve.png
//------------------------------------------------------------------------------

function startProgessBar() {
	gProgressBar = new ProgressBar("Applying Simple Dissolve...","Simple Dissolve",'');
	gProgressBar.open()
	dispatchEvent("com.adobe.event.createDissolveFile","")
}

//------------------------------------------------------------------------------
// applyDissolve - Don't leave trace of the operations executed by
// applyDissolveFilter()
//------------------------------------------------------------------------------

function applyDissolve(in_isLayerMask) {
	app.activeDocument.suspendHistory("Simple Dissolve", "applyDissolveFilter("+in_isLayerMask+")" );
	return gApplySuccessful;
}

//------------------------------------------------------------------------------
// Get the dissolve.png and apply it to layer or selection
//------------------------------------------------------------------------------

function applyDissolveFilter(in_isLayerMask) {
	try {
		do {
			gApplySuccessful = false
			gProgressBar.updateProgress(0.2);
			var doc = app.activeDocument;
			var hiddenChannels = getHiddenChannels(doc);
			var dissolveFile = File(Folder.temp+"/dissolve.png");
			if (! dissolveFile.exists) {
				alert("Cannot find file: "+dissolveFile.fsName);
				break;
			}
			var dissolveDoc = app.open(dissolveFile);
			gProgressBar.updateProgress(0.4);
			dissolveDoc.selection.selectAll();
			dissolveDoc.selection.copy(true);
			gProgressBar.updateProgress(0.5);
			dissolveDoc.close(SaveOptions.DONOTSAVECHANGES);
			app.activeDocument = doc;
			gProgressBar.updateProgress(0.6);
			var hasSelection = false;
			if (in_isLayerMask) {
				showMaskChannel(true);
				hideLayers(doc);
			}
			try {
				var selectBounds = doc.selection.bounds;
				makeWorkPath();
				var pathItems = doc.pathItems["Work Path"];
				pathItems.makeSelection();
				if (doc.activeLayer.allLocked) {
					doc.activeLayer.allLocked = false;
				}
				doc.paste(true);
				hasSelection = true;
			}
			catch(e) {
				doc.paste();
			}
			gProgressBar.updateProgress(0.8);
			// Merge down layer
			var idMrgtwo = charIDToTypeID( "Mrg2" );
				var desc163 = new ActionDescriptor();
			executeAction( idMrgtwo, desc163, DialogModes.NO );
			gProgressBar.updateProgress(0.9);
			if (hasSelection) {
				pathItems.makeSelection();
			}
			gApplySuccessful = true;
		}
		while (false);
		if (in_isLayerMask) {
			showMaskChannel(false);
		}
		reinstateHiddenChannels(hiddenChannels);
		gProgressBar.sectionCompleted();
		gProgressBar.close();
		app.refresh();
	} catch(e) {
		alert("Line: "+e.line+" - "+e);
	}
	return gRetVal
}

//------------------------------------------------------------------------------
// makeWorkPath - selection.makeWorkPath() does not seem to have the same effect.
//------------------------------------------------------------------------------

function makeWorkPath() {
	var idMk = charIDToTypeID( "Mk  " );
		var desc92 = new ActionDescriptor();
		var idnull = charIDToTypeID( "null" );
				var ref34 = new ActionReference();
				var idPath = charIDToTypeID( "Path" );
				ref34.putClass( idPath );
		desc92.putReference( idnull, ref34 );
		var idFrom = charIDToTypeID( "From" );
				var ref35 = new ActionReference();
				var idcsel = charIDToTypeID( "csel" );
				var idfsel = charIDToTypeID( "fsel" );
				ref35.putProperty( idcsel, idfsel );
		desc92.putReference( idFrom, ref35 );
		var idTlrn = charIDToTypeID( "Tlrn" );
		var idPxl = charIDToTypeID( "#Pxl" );
		desc92.putUnitDouble( idTlrn, idPxl, 2 );
	executeAction( idMk, desc92, DialogModes.NO );
}

//------------------------------------------------------------------------------
// getHiddenChannels - get the hidden channels into an array so they can be
// reinstate.
//------------------------------------------------------------------------------

function getHiddenChannels(in_doc) {
	retVal = []
	for (var idx = 0; idx < in_doc.channels.length; idx++) {
		var channel = in_doc.channels[idx];
		if (! channel.visible) {
			retVal.push(channel);
		}
	}
	return retVal
}


//------------------------------------------------------------------------------
// reinstateHiddenChannels - get the hidden channels into an array so they can be
// reinstate.
//------------------------------------------------------------------------------

function reinstateHiddenChannels(in_channels) {
	if (in_channels) {
		for (var idx = 0; idx < in_channels.length; idx++) {
			in_channels[idx].visible = false;
		}
	}
}

//------------------------------------------------------------------------------
// hideLayers - If we are dealing with a layer mask we need hide the layers
//------------------------------------------------------------------------------

function hideLayers(in_doc) {
	var retVal = [];
	for (var idx = 0; idx < in_doc.artLayers.length; idx++) {
		var artLayer = in_doc.artLayers[idx]
		if (in_doc.activeLayer != artLayer && artLayer.visible) {
			artLayer.visible = false;
			retVal.push(artLayer);
		}
	}
	return retVal;
}

//------------------------------------------------------------------------------
// showMaskChannel - Shows or hides the layer mask channel 
// in_show = true to show the layer mask channel (and false to hide)
//------------------------------------------------------------------------------

function showMaskChannel(in_show) {
	var idShw = charIDToTypeID( (in_show ? "Shw " : "Hd  "));
    var desc90 = new ActionDescriptor();
    var idnull = charIDToTypeID( "null" );
        var list12 = new ActionList();
            var ref82 = new ActionReference();
            var idChnl = charIDToTypeID( "Chnl" );
            var idChnl = charIDToTypeID( "Chnl" );
            var idMsk = charIDToTypeID( "Msk " );
            ref82.putEnumerated( idChnl, idChnl, idMsk );
        list12.putReference( ref82 );
    desc90.putList( idnull, list12 );
	executeAction( idShw, desc90, DialogModes.NO );
}

//------------------------------------------------------------------------------
// dispatchEvent - dispatches a CEP event
//------------------------------------------------------------------------------

function dispatchEvent(in_type,in_message) {
	var eventObj = new CSXSEvent();
	eventObj.type = in_type;
	eventObj.message = in_message;
	eventObj.dispatch();
}

//------------------------------------------------------------------------------
// storeDissolveImage - Creates the png with the dissolve that will be applied
// to the layer or selection
//------------------------------------------------------------------------------

function storeDissolveImage(in_contents)
{
	do {
		var retVal = false
		var dissolveFile = File(Folder.temp+"/dissolve.png")
		if (dissolveFile.exists) {
			dissolveFile.remove();
		}
		dissolveFile.encoding = "BINARY";
		if (! dissolveFile.open('w')) {
			break;
		}
		dissolveFile.write(unescape(in_contents));
		dissolveFile.close();
		retVal = dissolveFile.exists;
	}	
	while (false)
	return retVal.toString();
}

//------------------------------------------------------------------------------
// blockRefresh - Some voodoo to block the screen refresh. Good try!
//------------------------------------------------------------------------------

function blockRefresh () {
	var idsetd = charIDToTypeID( "setd" );
	var desc = new ActionDescriptor();
		var idnull = charIDToTypeID( "null" );
		var ref = new ActionReference();
			var idPrpr = charIDToTypeID( "Prpr" );
			var idPbkO = charIDToTypeID( "PbkO" );
		ref.putProperty( idPrpr, idPbkO );
	var idcapp = charIDToTypeID( "capp" );
	var idOrdn = charIDToTypeID( "Ordn" );
	var idTrgt = charIDToTypeID( "Trgt" );
	ref.putEnumerated( idcapp, idOrdn, idTrgt );
	desc.putReference( idnull, ref );
	var idT = charIDToTypeID( "T   " );
	var desc2 = new ActionDescriptor();
	var idperformance = stringIDToTypeID( "performance" );
	var idaccelerated = stringIDToTypeID( "accelerated" );
	desc2.putEnumerated( idperformance, idperformance, idaccelerated );
	var idPbkO = charIDToTypeID( "PbkO" );
	desc.putObject( idT, idPbkO, desc2 );
	executeAction( idsetd, desc, DialogModes.NO );
}

//------------------------------------------------------------------------------
// ProgressBar
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
// Constants
//------------------------------------------------------------------------------

//  determines how many milliseconds to wait before opening the progress bar
ProgressBar.openWindowDelay = 10;

// determines how many milliseconds to wait before redrawing the progress bar again
ProgressBar.updateDelay = 0;

//------------------------------------------------------------------------------
// Constructor
//------------------------------------------------------------------------------


function ProgressBar(text, windowtitle, canceltext, fontSize) {
	this.text = text;
	this.windowtitle = windowtitle;
	this.canceltext = canceltext;
	this.isopen = false;
	this.startTime = new Date().getTime();
	this.lastUpdate = 0;
	this.win = null;
	this.sections = new Array();
	this.progress = 0;
	this.fontSize = fontSize
	this.newSection(1, text, 1);
	
} // ProgressBar
	
//------------------------------------------------------------------------------
// ProgressBar.prototype.newSection
// Subdivide the progress bar
// Must be paired with a call to sectionCompleted
// title and fractionOfParentStep are optional arguments
//------------------------------------------------------------------------------

ProgressBar.prototype.newSection = function(numSteps, title, fractionOfParentStep) {
	if (fractionOfParentStep == undefined)
		fractionOfParentStep = 1;
	if (title == undefined)
		title = '';
	var numSections = this.sections.length;
	var start = (numSections > 0 ? this.sections[numSections-1].getTotalFractionComplete() : 0);
	var stepFraction = (numSections > 0 ? this.sections[numSections-1].fractionPerStep : 1);
	var newSection = new ProgressSection(title, start, start + (stepFraction * fractionOfParentStep), numSteps, fractionOfParentStep);
	this.sections.push(newSection);
	if(title != '')
		this.updateText(title);
} // ProgressBar.prototype.newSection


//------------------------------------------------------------------------------
// ProgressBar.prototype.sectionStepFractionCompleted
// Call if you completed a fraction of a step of the current section
//------------------------------------------------------------------------------
		
ProgressBar.prototype.sectionStepFractionCompleted = function(fraction) {
	var numSections = this.sections.length;
	if(numSections > 0) {
		var section = this.sections[numSections - 1];
		section.stepFractionComplete(fraction);
		this.updateProgress(section.getTotalFractionComplete());
	}
} // ProgressBar.prototype.sectionStepFractionCompleted


//------------------------------------------------------------------------------
// ProgressBar.prototype.sectionStepCompleted
// Call if you completed a step of the current section
//------------------------------------------------------------------------------
	
ProgressBar.prototype.sectionStepCompleted = function() {
	var numSections = this.sections.length;
	if(numSections > 0) {
		var section = this.sections[numSections - 1];
		section.stepComplete();
		this.updateProgress(section.getTotalFractionComplete());
	}
} // ProgressBar.prototype.sectionStepCompleted


//------------------------------------------------------------------------------
// ProgressBar.prototype.sectionCompleted
// Call if you completed the current section
//------------------------------------------------------------------------------
	
ProgressBar.prototype.sectionCompleted = function() {
	var section = this.sections.pop();
	var numSections = this.sections.length;
	if(numSections > 0) {
		var parent = this.sections[numSections - 1];
		parent.stepFractionComplete(section.fractionOfParent);
		this.updateProgress(parent.getTotalFractionComplete());
		if(parent.title != '' && section.title != '')
			this.updateText(parent.title);
	}
} // ProgressBar.prototype.sectionCompleted


//------------------------------------------------------------------------------
// ProgressBar.prototype.close
//------------------------------------------------------------------------------
	
ProgressBar.prototype.close = function () {
	if(this.isopen) {
		this.win.close();
		this.isopen = false;
	}
} // ProgressBar.prototype.close
	

//------------------------------------------------------------------------------
// END OF PUBLIC SECTION
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
// ProgressBar.prototype.open
//------------------------------------------------------------------------------

ProgressBar.prototype.open = function() {
	if(!this.isopen) {
		this.win = new Window( 'palette', this.windowtitle, undefined, { closeButton: false });;
		this.win.main = this.win.add('group',[100,100,480,300]);
		this.win.main.margins = [15,0,15,0];
		this.win.main.orientation = 'column';
		var group = this.win.main.add('group');
		group.orientation = 'column';
		group.alignChildren = ['left', 'fill'];
		this.win.displaytext = group.add('statictext', undefined, this.text,{multiline:true});
		//this.win.displaytext.minimumSize.width = 450
		this.win.displaytext.preferredSize = [350,40];
		if (this.fontSize != null)
		{
			this.win.displaytext.graphics.font = ScriptUI.newFont(this.win.displaytext.graphics.font.name,0,this.fontSize);
		}
		this.win.progressbar = group.add('progressbar', undefined, 0, 1);
		this.win.progressbar.minimumSize.width = 320;
		group.add('statictext', undefined, this.canceltext);
		this.win.layout.layout(true);
		this.win.show();
		this.isopen = true;
	}
} // ProgressBar.prototype.open


//------------------------------------------------------------------------------
// ProgressBar.prototype.updateText
//------------------------------------------------------------------------------
ProgressBar.prototype.updateText = function(text) {
	if(this.isopen) {
		if(this.text != text) {
			this.win.displaytext.text = text;
			this.win.update()
		}
	}
	this.text = text;
} // ProgressBar.prototype.updateText
	

//------------------------------------------------------------------------------
// ProgressBar.prototype.updateProgress
//------------------------------------------------------------------------------
ProgressBar.prototype.updateProgress = function(progressValue) {
	var now = new Date().getTime();
	if(!this.isopen) {
		if(now - this.startTime >= ProgressBar.openWindowDelay) {
			this.progress = progressValue;
			this.open();
		}
	} else {
		if(progressValue > this.progress) {
			this.progress = progressValue;
			if (now - this.lastUpdate >= ProgressBar.updateDelay) {
				this.lastUpdate = now;
				this.win.progressbar.value = progressValue;
			}
		}
	}	
} // ProgressBar.prototype.updateProgress


//------------------------------------------------------------------------------
// Definition and Implementation for ProgressSection Object
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
// Constructor
//------------------------------------------------------------------------------
	
function ProgressSection(title, start, end, numSteps, fractionOfParentStep) {
	this.start = start;
	this.end = end;
	this.numSteps = numSteps;
	this.fractionPerStep = (end-start)/numSteps;
	this.stepsComplete = 0;
	this.curStepFractionComplete = 0;
	this.fractionOfParent = fractionOfParentStep;
	this.title = title;
} // ProgressSection


//------------------------------------------------------------------------------
// ProgressSection.prototype.stepComplete
//------------------------------------------------------------------------------

ProgressSection.prototype.stepComplete = function() {
	this.stepsComplete++;
	this.curStepFractionComplete = 0;
} // ProgressSection.prototype.stepComplete


//------------------------------------------------------------------------------
// CProgressSection.prototype.stepFractionComplete
// This allows to mark a fraction of the current section as being complete
//------------------------------------------------------------------------------

ProgressSection.prototype.stepFractionComplete = function(fraction) {
	this.curStepFractionComplete = fraction;
} // ProgressSection.prototype.stepFractionComplete


//------------------------------------------------------------------------------
// ProgressSection.prototype.getTotalFractionComplete
//------------------------------------------------------------------------------

ProgressSection.prototype.getTotalFractionComplete = function() {
	return this.start + (this.stepsComplete * this.fractionPerStep) + (this.curStepFractionComplete * this.fractionPerStep);
} // ProgressSection.prototype.getTotalFractionComplete


