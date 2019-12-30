//<script language="javascript">
//
// CCR Bailout Gas Calculator
//
// Copyright (c) 2015 - Opua Enterprises LLC.  All rights reserved.
//
// gkn@opua.org

// Initialization

function Init()
{
}

// Compute the required bailout gas volume

function bailoutGas()
{
  var probTime = parseFloat(document.getElementById("ProbTime").value);
  var bailoutGasCF = document.getElementById("bailoutGasCF");

  // Next we need the table populated with stop info

  var table = document.getElementById("addRowsHere");
  if (table.rows.length > 0 && !isNaN(probTime) && probTime > 0) {

    // Ok, we should (in theory) have some stops.  Compute the gas requirements:
    // At each stop, ATA * Emergency SCR * Stop time
    //
    // Compute the total ascent time and TTS (the latter includes the problem
    // resolution time)

    // Make sure that the last stop includes the problem resoultion time
    // (in case it changed and that's why we're here)

    table.rows[table.rows.length - 1].cells[2].firstElementChild.value = probTime.toFixed();

    var gasNeeded = 0.0;
    var ascentTime = 0;
    var eSCR = parseFloat(document.getElementById("SCR").value);
    var cns = 0.0;
    var otus = 0.0;

    // Walk the table computing gas requirements at each stop

    for (var i = 0; i < table.rows.length; i++) {
      var row = table.rows[i];

      // Row cells:
      //  0 - Pressure in ATA
      //  1 - Depth in FSW
      //  2 - Stop time input (firstElementChild)
      //  3 - Run time
      //  4 - Cubic Feet of gas needed
      //  5 - Gas mixture
      //  6 - PO2
      //  7 - END
      //  8 - CNS
      //  9 - OTUs

      var ata = parseFloat(row.cells[0].innerHTML);
      var stopCell = row.cells[2];
      var stopTime = parseFloat(stopCell.firstElementChild.value);
      var runCell = row.cells[3];
      var cuFtCell = row.cells[4];
      var pO2cell = row.cells[6];
      var cnsCell = row.cells[8];
      var otuCell = row.cells[9];

      if (!isNaN(stopTime) && stopTime > 0) {
        var stopGas = ata * eSCR * stopTime;
        var pO2 = parseFloat(pO2cell.innerHTML);

        gasNeeded += stopGas;
        ascentTime += stopTime;
        cuFtCell.innerHTML = stopGas.toFixed(1);

        if (!isNaN(pO2) && pO2 > 0.5) {
          var stopCNS = calcCNS(pO2, stopTime);
          var stopOTUs = Math.pow(((2.0 * pO2) - 1.0), 0.833) * stopTime;

          cns += stopCNS;
          otus += stopOTUs;

          cnsCell.innerHTML = stopCNS.toFixed(2);
          otuCell.innerHTML = stopOTUs.toFixed(1);

        } else {
          cnsCell.innerHTML = "";
          otuCell.innerHTML = "";
        }

      } else {
        cuFtCell.innerHTML = "";
        stopCell.firstElementChild.value = "";
        cnsCell.innerHTML = "";
        otuCell.innerHTML = "";
      }
    }

    // Now compute the time to the first stop and add that in to the ascent time

    var maxDepth = parseFloat(document.getElementById("MaxDepth").value);
    var firstStop = 0;
    var maxPO2 = parseFloat(table.rows[table.rows.length - 1].cells[6].innerHTML);
    var minPO2 = 0.0;

    // Search for the first stop starting at the end of the table

    for (var i = table.rows.length - 2; i > 0; i--) {
      if (table.rows[i].cells[2].firstElementChild.value) {
        firstStop = (i + 1) * 10.0;
        minPO2 = parseFloat(table.rows[i].cells[6].innerHTML);
        break;
      }
    }

    var ttfs = Math.ceil((maxDepth - firstStop) / 30.0);
    var avgATA = (((maxDepth + firstStop) / 2) / 33.0) + 1.0;
    ascentTime += ttfs;

    // Gas needed for the portion of the ascent to the first stop

    var gasttfs = avgATA * eSCR * ttfs;
    gasNeeded += gasttfs;

    // Ok, at this point we know how much gas we need.

    bailoutGasCF.value = gasNeeded.toFixed(1);

    // Park the gas needed for the ascent to the first stop at the next deeper
    // stop depth in the table

    var r = table.rows[(firstStop / 10)];
    r.cells[4].innerHTML = gasttfs.toFixed(1);

    // If we know the max and min PO2 information, park the CNS and OTU information
    // in the same row

    if (!isNaN(maxPO2) && maxPO2 > 0.5 && !isNaN(minPO2)) {
      var ascCNS = calcCNS(((maxPO2 + minPO2) / 2), ttfs);
      var ascOTUs = calcOTUs(ttfs, maxPO2, minPO2);

      cns += ascCNS;
      otus += ascOTUs;

      r.cells[8].innerHTML = ascCNS.toFixed(2);
      r.cells[9].innerHTML = ascOTUs.toFixed(1);
    }

    // Total CNS and OTUs for the ascent

    if (cns > 0.0)
      document.getElementById("CNS").value = cns.toFixed(1);
    if (otus > 0.0)
      document.getElementById("OTUs").value = otus.toFixed(1);

    // Walk down the remaining stop times until we hit the bottom and park an up arrow
    // Park an up arrow in the CNS and OTU columns if the CNS and OTUs for the ascent are known

    for (var i = (firstStop / 10) + 1; i < table.rows.length - 1; i++) {
      table.rows[i].cells[4].innerHTML = "&uarr;";
      table.rows[i].cells[8].innerHTML = table.rows[(firstStop / 10)].cells[8].innerHTML != "" ? "&uarr;" : "";
      table.rows[i].cells[9].innerHTML = table.rows[(firstStop / 10)].cells[9].innerHTML != "" ? "&uarr;" : "";
    }

    // Walk the table from the first stop up, computing the run time

    var runTime = probTime + ttfs;
    if (firstStop == 0)
      table.rows[0].cells[3].innerHTML = runTime.toFixed();
    else {
      for (var i = (firstStop / 10); i >= 0; i--) {
        var stopCell = table.rows[i].cells[2];
        var stopTime = parseFloat(stopCell.firstElementChild.value);
        var runCell = table.rows[i].cells[3];

        if (!isNaN(stopTime) && stopTime > 0.0) {
          runCell.innerHTML = runTime.toFixed();
          runTime += stopTime + 1;  // Stop plus ascent to next stop
        }
      }
    }

    document.getElementById("TTS").value = runTime.toFixed();
    document.getElementById("ascentTime").value = (ascentTime - probTime).toFixed();

    // Now walk the gas mix table, and update totals

    var mixTable = document.getElementById("addGassesHere");
    if (mixTable.rows.length > 0) {

      // Collect all the mixes into an object
      //
      // Object properties are the names of the mixes;  the values are the total gas required

      var mixes = {};

      for (var i = 0; i < mixTable.rows.length; i++) {
        var mixKey = mixTable.rows[i].cells[0].innerHTML;
        if (!mixes.propertyIsEnumerable[mixKey])
          mixes[mixKey] = 0.0;
      }

      // Add up the gas requirements

      for (var i = 0; i < table.rows.length; i++) {
        var mixKey = table.rows[i].cells[5].firstElementChild.value;
        var gas = parseFloat(table.rows[i].cells[4].innerHTML);
        if (mixKey != "" && !isNaN(gas))
          mixes[mixKey] += gas;
      }

      // Update the mix table

      for (var i = 0; i < mixTable.rows.length; i++) {
        var mixKey = mixTable.rows[i].cells[0].innerHTML;
        mixTable.rows[i].cells[1].innerHTML = mixes[mixKey].toFixed(1);
      }
    } // mixTable.rows.length
  } // for table.rows.length
  return;
}

// Verify a number is in a given range

function verifyNumber(input, min, max, sigFigs)
{
  var n = parseFloat(input.value);
  if (isNaN(n) || n < min || n > max) {
    alert("Please enter a value between " + min.toFixed(sigFigs) + " and " + max.toFixed(sigFigs));
    input.select();
    input.focus();
  } else
    input.value = n.toFixed(sigFigs);
  bailoutGas();
  return;
}

// Process the maximum depth field

function processMaxDepth(input)
{
  var maxDepth = parseFloat(input.value);

  if (isNaN(maxDepth) || maxDepth < 10.0 || maxDepth > 1000.0) {
    alert("Please enter a value between 10 and 1000");
    input.select();
    input.focus();
    return;
  }
  maxDepth = roundUp(maxDepth, 10);
  input.value = maxDepth.toFixed();

  // Now populate the table

  var table = document.getElementById("addRowsHere");

  // Pare the table down to the header

  for (var i = table.rows.length - 1; i >= 0; i--)
    table.deleteRow(i);

  // Empty the gas mixture table

  var mixTable = document.getElementById("addGassesHere");
  for (var i = mixTable.rows.length - 1; i >= 0; i--)
    mixTable.deleteRow(i);

  // Populate the depth table

  for (var i = 0; i < maxDepth / 10; i++) {

    var row = table.insertRow(i);

    var ataCell = row.insertCell(0);
    var depthCell = row.insertCell(1);
    var timeCell = row.insertCell(2);
    var runCell = row.insertCell(3);
    var cuFtCell = row.insertCell(4);
    var mixCell = row.insertCell(5);
    var pO2Cell = row.insertCell(6);
    var endCell = row.insertCell(7);
    var cnsCell = row.insertCell(8);
    var otuCell = row.insertCell(9);

    ataCell.style.textAlign = "center";
    depthCell.style.textAlign = "center";
    timeCell.style.textAlign = "center";
    runCell.style.textAlign = "center";
    cuFtCell.style.textAlign = "center";
    mixCell.style.textAlign = "center";
    pO2Cell.style.textAlign = "center";
    endCell.style.textAlign = "center";
    cnsCell.style.textAlign = "center";
    otuCell.style.textAlign = "center";

    var depth = (i * 10.0) + 10.0;

    // Ambient pressure in atmospheres absolute

    var ata = (depth / 33.0) + 1.0;
    ataCell.innerHTML = ata.toFixed(1);

    // Depth in FSW

    depthCell.innerHTML = depth.toFixed();

    // Time - input value

    var timeInput = document.createElement("input");
    timeInput.type = "text";
    timeInput.name = "stop" + depth.toFixed();
    timeInput.id = "stop" + depth.toFixed();
    timeInput.size = 3;
    timeInput.maxLength = 3;
    timeInput.style.textAlign = "center";
    timeInput.onchange = function() { document.getElementById("nominal").checked = false; bailoutGas(); };
    timeCell.appendChild(timeInput);

    // Mix - input value

    var mixInput = document.createElement("input");
    mixInput.type = "text";
    mixInput.name = "mix" + depth.toFixed();
    mixInput.id = "mix" + depth.toFixed();
    mixInput.size = 8;
    mixInput.maxLength = 8;
    mixInput.style.textAlign = "center";
    mixInput.onchange = function() { addMix(this); };
    mixCell.appendChild(mixInput);

  }

  // Figure out what we have for an ascent profile so far

  var firstStop = 0;
  var TTS = 0;
  var ascentTime = 0;
  var pTime = parseFloat(document.getElementById("ProbTime").value);

  var ascentInfo = nominalAscent();
  firstStop = ascentInfo.firstStop;
  TTS = ascentInfo.TTS;
  ascentTime = ascentInfo.ascentTime;

  if (firstStop == 0) {

    // Set the bottom time element to the problem resolution time

    table.rows[table.rows.length - 1].cells[2].firstElementChild.value = pTime.toFixed();
    TTS += pTime;

    // Calculate the time to the first stop

    var ttfs = Math.ceil((maxDepth - firstStop) / 30.0);

    TTS += ttfs;
    ascentTime += ttfs;
  }
  document.getElementById("TTS").value = TTS.toFixed();
  document.getElementById("ascentTime").value = ascentTime.toFixed();
  bailoutGas();
  return;
}

// Populate the stop table with a nominal ascent profile

function nominalAscent()
{
  var ascentInfo = { firstStop: 0, TTS: 0, ascentTime: 0};
  var firstStop = 0;
  var maxDepth = parseFloat(document.getElementById("MaxDepth").value);
  var table = document.getElementById("addRowsHere");

  if (document.getElementById("nominal").checked) {

    firstStop = roundUp((maxDepth / 2), 10);
    ascentInfo.firstStop = firstStop;

    for (var i = 0, row; row = table.rows[i]; i++) {

      var tCellInput = row.cells[2].firstElementChild;

      // Min deco stops every 10 feet for one minute up to the first stop, with the
      // exception of 20 FSW, where the stop time is 3 minutes

      if (i == 1) {

        // 20 foot stop

        tCellInput.value = "3";
        ascentInfo.TTS += 3 + 1; // include time to next stop
        ascentInfo.ascentTime += 3;

      } else if (i == (firstStop / 10.0) - 1) {

        // First stop

        tCellInput.value = "1";
        ascentInfo.TTS++;        // don't include tim to next stop for the first stop

      } else if (i < firstStop / 10.0) {

        // Any stop shallower than the first stop that's not the 20 foot stop

        tCellInput.value = "1";
        ascentInfo.TTS += 1 + 1; // include time to next stop
        ascentInfo.ascentTime += 1 + 1;

      } else {

        // Deeper than the first stop, times are 0 except for the bottom

        if (i < table.rows.length - 1)
          tCellInput.value = "";
        else {

          // Set the bottom time element to the problem resolution time

          var pTime = parseFloat(document.getElementById("ProbTime").value);
          tCellInput.value = pTime.toFixed();
          ascentInfo.TTS += pTime;

          // Include ascent time to first stop

          var ttfs = Math.ceil((maxDepth - firstStop) / 30.0);

          ascentInfo.TTS += ttfs;
          ascentInfo.ascentTime += ttfs;

        } // i < table.rows.length
      } // else i < firstStop / 10
    } // for
  } // nominal.checked
  bailoutGas();
  return (ascentInfo);
}

// Add a gas to the gas mixture table

function addMix(input)
{
  var depthTable = document.getElementById("addRowsHere");
  var mix = ParseMix(input.value);

  if (mix) {

    input.value = mix.shortName();
    var mixTable = document.getElementById("addGassesHere");
    var found = 0;

    // Search the gas mix table to see if we already have this one

    for (var i = 0; i < mixTable.rows.length; i++) {

      // Row cells:
      //  0 - Mix name
      //  1 - cuFt needed

      if (mixTable.rows[i].cells[0].innerHTML == input.value) {
        found++;
        break;
      }
    }

    if (!found) {

      // Add a new row

      var row = mixTable.insertRow(-1);
      var mixCell = row.insertCell(0);
      var cuFtCell = row.insertCell(1);

      mixCell.style.textAlign = "center";
      mixCell.innerHTML = input.value;

      cuFtCell.style.textAlign = "center";

      // This function gets called from two places - one from the schedule table input
      // and the other is the add a mixture input at the bottom of the form.  In the
      // former case we'll assume that we're going to start using the mix at the current
      // depth in the table.  In the latter case we'll assume that we're going to start
      // using the new mix at its MOD.

      var depthRowIndex = 0;

      if (input.id == "mixTextInput")
        depthRowIndex = Math.min((roundDown(mix.MOD(maxATA(mix)), 10) / 10.0), depthTable.rows.length) - 1;
      else
        depthRowIndex = input.parentElement.parentElement.rowIndex - 1; // parent = cell, grandparent = row

      // Start from the current spot and work shallower

      for (var i = depthRowIndex; i >= 0; i--) {

        var mixCell = depthTable.rows[i].cells[5];
        var timeCell = depthTable.rows[i].cells[2];
        var pO2Cell = depthTable.rows[i].cells[6];
        var endCell = depthTable.rows[i].cells[7];
        var cnsCell = depthTable.rows[i].cells[8];
        var otuCell = depthTable.rows[i].cells[9];

        var depth = (i + 1) * 10.0;

        if (!mixCell.firstElementChild.value) {                         // New mix
          mixCell.firstElementChild.value = input.value;

          // Force a 1 minute stop at a mix change if we were called by changing the mix in the table
          // Unless it was the mix at the bottom

          if (input.id != "mixTextInput" && depthRowIndex < depthTable.rows.length - 1 && timeCell.firstElementChild.value == "") {
            timeCell.firstElementChild.value = "1";
            document.getElementById("nominal").checked = false;
          }

        } else {

          // We have a mix at this depth.  Choose the new mix if it's MOD is shallower

          var curMix = ParseMix(mixCell.firstElementChild.value);
          if ((mix.MOD(maxATA(mix)) < curMix.MOD(maxATA(curMix))) || input.id == ("mix" + depth.toFixed())) { // hack.  sorry.
            mixCell.firstElementChild.value = input.value;

            // Force a 1 minute stop at a mix change

            if (timeCell.firstElementChild.value == "") {
              timeCell.firstElementChild.value = "1";
              document.getElementById("nominal").checked = false;
            }
          }
        }

        // Mix in red if it's beyond its MOD

        var stopMix = ParseMix(mixCell.firstElementChild.value);

        var color = depth > stopMix.MOD(maxATA(stopMix)) ? "red" : "";
        mixCell.firstElementChild.style.color = color;

        // Compute the PO2 and END at this depth

        var pO2 = stopMix.PO2(depth);
        var end = Math.floor(stopMix.END(depth));

        // PO2 in red if > 1.6 or < 0.16

        color = (pO2 > maxATA(stopMix) || pO2 < 0.16) ? "red" : "";
        pO2Cell.innerHTML = pO2.toFixed(2);
        pO2Cell.style.color = color;

        // END in red if > 100

        color = end > 100.0 ? "red" : "";
        endCell.innerHTML = end.toFixed();
        endCell.style.color = color;

        // CNS and OTUs at this depth

        var stopTime = parseFloat(timeCell.firstElementChild.value);
        if (!isNaN(stopTime) && stopTime > 0 && pO2 > 0.5) {
          cnsCell.innerHTML = calcCNS(pO2, stopTime).toFixed(2);
          otuCell.innerHTML = (Math.pow(((2.0 * pO2) - 1.0), 0.833) * stopTime).toFixed(1);
        } else {
          cnsCell.innerHTML = "";
          otuCell.innerHTML = "";
        }
      }  // for

      sortGasses();
      bailoutGas();

    } else {  // !found

      // If we're changing a mix in the table, adjust the colors for PO2, END warnings

      if (input.id != "mixTextInput") {

        var depthRowIndex = input.parentElement.parentElement.rowIndex - 1;  // parent = cell, grandparent = row
        var timeCell = depthTable.rows[depthRowIndex].cells[2];
        var mixCell = depthTable.rows[depthRowIndex].cells[5];
        var pO2Cell = depthTable.rows[depthRowIndex].cells[6];
        var endCell = depthTable.rows[depthRowIndex].cells[7];
        var cnsCell = depthTable.rows[depthRowIndex].cells[8];
        var otuCell = depthTable.rows[depthRowIndex].cells[9];

        var depth = (depthRowIndex + 1) * 10.0;

        // Mix in red if PO2 at this depth > 1.6

        var color = depth > mix.MOD(maxATA(mix)) ? "red" : "";

        mixCell.firstElementChild.style.color = color;
        mixCell.firstElementChild.value = input.value;

        // Compute the PO2 and END at this depth

        var pO2 = mix.PO2(depth);
        var end = Math.floor(mix.END(depth));

        // PO2 in red if > 1.6 or < 0.16

        color = (pO2 > maxATA(mix) || pO2 < 0.16) ? "red" : "";
        pO2Cell.style.color = color;
        pO2Cell.innerHTML = pO2.toFixed(2);

        // END in red if > 100

        color = end > 100.0 ? "red" : "";
        endCell.style.color = color;
        endCell.innerHTML = end.toFixed();

        // CNS and OTUs at this depth

        var stopTime = parseFloat(timeCell.firstElementChild.value);
        if (!isNaN(stopTime) && stopTime > 0 && pO2 > 0.5) {
          cnsCell.innerHTML = calcCNS(pO2, stopTime).toFixed(2);
          otuCell.innerHTML = (Math.pow(((2.0 * pO2) - 1.0), 0.833) * stopTime).toFixed(1);
        } else {
          cnsCell.innerHTML = "";
          otuCell.innerHTML = "";
        }
      }

      bailoutGas();

    }  // !found

  } else {  // bad mix
    input.value = "";
    input.focus();
  }

  if (input.id == "mixTextInput")
    input.value = "";
  return;
}

// Populate the table with default gasses

function populateDefaultGasses(input)
{
  var maxDepth = parseFloat(document.getElementById("MaxDepth").value);
  var mixTextInput = document.getElementById("mixTextInput");

  if (!input.checked || isNaN(maxDepth) || maxDepth == 0) {
    input.checked = false;
    return;
  } else if (maxDepth <= 130.0) {

    // 130 FSW - 32%

    mixTextInput.value = "32";
    addMix(mixTextInput);

  } else if (maxDepth <= 210.0) {

    // 210 FSW - 21/35 and O2

    mixTextInput.value = "21/35";
    addMix(mixTextInput);
    mixTextInput.value = "O2";
    addMix(mixTextInput);

  } else if (maxDepth <= 250.0) {

    // 250 FSW - 18/45, 50% and O2

    mixTextInput.value = "18/45";
    addMix(mixTextInput);
    mixTextInput.value = "50";
    addMix(mixTextInput);
    mixTextInput.value = "O2";
    addMix(mixTextInput);

  } else if (maxDepth <= 320.0) {

    // 320 FSW - 15/55, 35/25 and O2

    mixTextInput.value = "15/55";
    addMix(mixTextInput);
    mixTextInput.value = "35/25";
    addMix(mixTextInput);
    mixTextInput.value = "O2";
    addMix(mixTextInput);

  } else if (maxDepth <= 400.0) {

    // 400 FSW - 10/70, 21/35, 35/25 and O2

    mixTextInput.value = "10/70";
    addMix(mixTextInput);
    mixTextInput.value = "21/35";
    addMix(mixTextInput);
    mixTextInput.value = "35/25";
    addMix(mixTextInput);
    mixTextInput.value = "O2";
    addMix(mixTextInput);

  } else {

    // Deep - 8/80, 21/35, 35/25, 50/20 and O2

    mixTextInput.value = "8/80";
    addMix(mixTextInput);
    mixTextInput.value = "21/35";
    addMix(mixTextInput);
    mixTextInput.value = "35/25";
    addMix(mixTextInput);
    mixTextInput.value = "50/20";
    addMix(mixTextInput);
    mixTextInput.value = "O2";
    addMix(mixTextInput);
  }
  return;
}

// Return the maximum pressure for a given mix

function maxATA(mix)
{
  if (!mix)
    return(1.6);
  else if (mix.shortName() == "21/35")
    return(1.5);
  else if (mix.shortName() == "35/25")
    return(1.63);
  else if (mix.Type == "Oxygen")
    return(1.61);
  else
    return(1.6);
}

// Sort the gas mixture table by MOD

function sortGasses()
{
  var mixArray = Array();
  var mixTable = document.getElementById("addGassesHere");

  for (var i = 0; i < mixTable.rows.length; i++)
    mixArray[i] = Array(mixTable.rows[i].cells[0].innerHTML, mixTable.rows[i].cells[1].innerHTML);

  mixArray.sort(byMOD);

  for (var i = 0; i < mixArray.length; i++) {
    mixTable.rows[i].cells[0].innerHTML = mixArray[i][0];
    mixTable.rows[i].cells[1].innerHTML = mixArray[i][1];
  }
  return;
}

// Ranking function to sort a gas mixture by MOD

function byMOD(a, b)
{
  var mixA = ParseMix(a[0]);
  var mixB = ParseMix(b[0]);

  return (mixA.MOD(1.6) - mixB.MOD(1.6));
}

// Calculate the % CNS exposure for a given pO2 and time

function calcCNS(pO2, time)
{
  var percentCNS = Array(0.12, 0.14, 0.18, 0.22, 0.28, 0.33, 0.42, 0.48, 0.56, 0.67, 0.83, 2.22, 10.0, 50.0); // 0.5 - 1.8 ATA PO2

  if (pO2 < 0.5)
    return(0.0);
  else if (pO2 > 1.8)
    return(100.0);
  else
    return (time * percentCNS[((pO2.toFixed(1) - 0.5) * 10).toFixed()]);
}

// Calculate OTUs for an ascent or descent (at a fixed rate)

function calcOTUs(time, maxPO2, minPO2)
{
  var mPO2 = Math.max(0.5, minPO2);
  var o2Time = time * (maxPO2 - mPO2) / (maxPO2 - minPO2);

  return(((0.273 * o2Time) / (maxPO2 - mPO2)) * (Math.pow(((maxPO2 - 0.5) / 0.5), 1.833) - Math.pow(((mPO2 - 0.5) / 0.5), 1.833)));
}

// Reset everything

function reset()
{
  var stopTable = document.getElementById("addRowsHere");
  var gasTable = document.getElementById("addGassesHere");

  document.getElementById("MaxDepth").value = "";
  document.getElementById("nominal").checked = false;
  document.getElementById("defaultGasses").checked = false;
  document.getElementById("ProbTime").value = "1";
  document.getElementById("SCR").value = "1.0";
  document.getElementById("TTS").value = "";
  document.getElementById("ascentTime").value = "";
  document.getElementById("bailoutGasCF").value = "";
  document.getElementById("CNS").value = "";
  document.getElementById("OTUs").value = "";

  for (var i = stopTable.rows.length - 1; i >= 0; i--)
    stopTable.deleteRow(i);
  for (var i = gasTable.rows.length - 1; i >= 0; i--)
    gasTable.deleteRow(i);

  return;
}

// Round up to the nearest multiple of up

function roundUp(n, up)
{
  if (n % up == 0)
    return (n);
  else
    return (n + (up - (n % up)));
}

// Round down to the nearest multiple of down

function roundDown(n, down)
{
  return (n - (n % down));
}
//</script>
