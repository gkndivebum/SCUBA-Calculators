//<script language="javascript">>
//
// Open Circuit Technical Dive Planner
//
// Copyright (c) 2015 - Opua Enterprises LLC.  All rights reserved.
//
// gkn@opua.org

// Initialization

function Init()
{
  // Populate the cylinders table with one backgas cylinder

  var cylTable = document.getElementById("addCylindersHere");
  for (var i = cylTable.rows.length - 1; i >= 0; i--)
    cylTable.deleteRow(i);

  addCylinder("BackGas", false);

  // Populate the mix table with a slot for the bottom mix

  var mixTable = document.getElementById("addGassesHere");
  for (var i = mixTable.rows.length - 1; i >= 0; i--)
    mixTable.deleteRow(i);

  mixTable.insertRow(-1);
  mixTable.rows[0].insertCell(0);
  mixTable.rows[0].insertCell(1);
  mixTable.rows[0].cells[0].style.textAlign = "center";
  mixTable.rows[0].cells[1].style.textAlign = "center";
  mixTable.rows[0].cells[0].innerHTML = "&nbsp;";  // Un-collapse the row - ugh!

  return;
}

// Add a cylinder of the designated kind ("Stage" or "BackGas")
// Returns the row index of the new cylinder

function addCylinder(kind, deleteCB)
{
  var cylTable = document.getElementById("addCylindersHere");

  // Add a row
  //
  // Cells:
  //  0 - Cylinder select
  //  1 - Mix input
  //  2 - Fill pressure input
  //  3 - Reserve pressure
  //  4 - Delete checkbox

  var row = cylTable.insertRow(-1);
  var cylCell = row.insertCell(0);
  var mixCell = row.insertCell(1);
  var fillCell = row.insertCell(2);
  var reserveCell = row.insertCell(3);

  mixCell.style.textAlign = "center";
  fillCell.style.textAlign = "center";
  reserveCell.style.textAlign = "center";

  // Cylinder select input

  var cylSelect = document.createElement("select");
  cylSelect.name = kind + row.rowIndex.toFixed();
  cylSelect.id = kind + row.rowIndex.toFixed();
  cylSelect.onchange = function() { processCylinder(this); };
  cylCell.appendChild(cylSelect);

  // Mix input

  var mixInput = document.createElement("input");
  mixInput.type = "text";
  mixInput.name = "cylMix" + row.rowIndex.toFixed();
  mixInput.id = "cylMix" + row.rowIndex.toFixed();
  mixInput.size = 8;
  mixInput.maxLength = 8;
  mixInput.style.textAlign = "center";
  mixInput.onchange = function() { addMix(this); };
  mixCell.appendChild(mixInput);

  // Fill pressure input

  var fillPinput = document.createElement("input");
  fillPinput.name = "fillP" + row.rowIndex.toFixed();
  fillPinput.id = "fillP" + row.rowIndex.toFixed();
  fillPinput.size = 4;
  fillPinput.maxLength = 4;
  fillPinput.style.textAlign = "center";
  fillPinput.onchange = function() { fillPressure(this); };
  fillCell.appendChild(fillPinput);


  // Delete cylinder checkbox input, only for stage cylinders (i.e., anything after the first row in the table)

  if (kind == "Stage" && deleteCB) {
    var delCell = row.insertCell(4);
    var delInput = document.createElement("input");
    var delLabel = document.createElement("label");

    delCell.style.textAlign = "left";
    delCell.style.fontStyle = "italic";
    delCell.style.fontSize = "smaller";
    delCell.style.borderCollapse = "collapse";
    delCell.style.borderStyle = "none";

    delInput.type = "checkbox";
    delInput.name = "delCyl" + row.rowIndex.toFixed();
    delInput.id = "delCyl" + row.rowIndex.toFixed();
    delInput.onclick = function() { deleteThisCylinder(this); };

    delLabel.htmlFor = "delCyl" + row.rowIndex.toFixed();
    delLabel.innerHTML = "Delete";

    delCell.appendChild(delInput);
    delCell.appendChild(delLabel);
  }

  // Populate the cylinder select.  The first option is empty

  cylSelect.add(new Option("--------", "", false, false));

  // Now add cylinders of the specified kind

  var description = "";
  switch (kind) {
    default:
      alert('addCylinder() - what do you want me to do with "' + kind + '"?');
      cylTable.deleteRow(row.Index - 1);
      break;

    case "Stage":
      for (var key in Cylinders) {
        if (Cylinders[key].Stage) {
          description = Cylinders[key].Description + " (" +
                        Cylinders[key].Volume.toFixed(1) + " ft3 at " +
                        Cylinders[key].Pressure.toFixed() + " PSI)";
          cylSelect.add(new Option(description, key, false, false));
        }
      }
      break;

    case "BackGas":
      for (var key in Cylinders) {
        if (Cylinders[key].BackGas && !Cylinders[key].Stage && Cylinders[key].Volume > 90.0) {
          description = Cylinders[key].Description + " (" +
                        Cylinders[key].Volume.toFixed(1) + " ft3 at " +
                        Cylinders[key].Pressure.toFixed() + " PSI)";
          cylSelect.add(new Option(description, key, false, false));
        }
      }
      break;
  }
  return(row.rowIndex - 1);
}

// Process a change in a cylinder

function processCylinder(input)
{
  var row = input.parentElement.parentElement;  // parent = <td>, grandparent = <tr>

  // Set the fill pressure of the nominated cylinder to the rated pressure of the cylinder
  // or, if we've de-selected a cylinder then zero out the fill pressure and reserve pressure
  // cells.

  if (input.selectedIndex == 0) {
    row.cells[2].firstElementChild.value = "";
    row.cells[3].innerHTML = "";
  } else
    row.cells[2].firstElementChild.value = Cylinders[input.value].Pressure;

  divePlan();  // will call gasVolume()
  return;
}

// Process a change in a fill pressure

function fillPressure(input)
{
  var row = input.parentElement.parentElement;  // parent = <td>, grandparent = <tr>

  // Need a cylinder selected

  if (row.cells[0].firstElementChild.selectedIndex == 0) {
    alert("Please choose a cylinder");
    input.value = "";
    input.focus();
    return;
  }

  // Ensure that the fill pressure is between 50% and 150% of the rated pressure of the
  // nominated cylinder.  verifyNumber() will call divePlan() (which will call gasVolume())
  // if the number is in range

  var cylinder = Cylinders[row.cells[0].firstElementChild.value];
  verifyNumber(input, roundDown(cylinder.Pressure * 0.5, 100), roundDown(cylinder.Pressure * 1.5, 100), 0);
  return;
}

// Update the cylinder table, making sure we have a cylinder with the given mix

function findOrAddCyl(mix)
{
  var cylTable = document.getElementById("addCylindersHere");
  var maxDepth = parseFloat(document.getElementById("MaxDepth").value);

  // We need the maximum depth to do pretty much anything

  adjustBackGasCylSelect();      // Prune singles from the back gas select if deep
  if (!isNaN(maxDepth)) {

    // If the MOD of this mix is deeper than the maximum depth and we don't have
    // a mix assigned to our backgas cylinder then assign it there.

    if (mix.MOD(maxATA(mix)) > maxDepth && cylTable.rows[0].cells[1].firstElementChild.value == "") {
      var originalBottomMix = cylTable.rows[0].cells[1].firstElementChild.value;
      cylTable.rows[0].cells[1].firstElementChild.value = mix.shortName();

      // Park this mix in any automatically added backgas cylinders

      for (i = 1; i < cylTable.rows.length; i++) {
        if (cylTable.rows[i].cells[1].firstElementChild.value == originalBottomMix)
          cylTable.rows[i].cells[1].firstElementChild.value = mix.shortName();
      }

    } else if (mix.MOD(maxATA(mix)) < maxDepth) {

      // If the MOD of this mix is shallower than the maximum depth ensure that
      // we have a stage cylinder with this mix

      var found = 0;

      for (var i = 1; i < cylTable.rows.length; i++) {
        if (cylTable.rows[i].cells[1].firstElementChild.value == mix.shortName()) {
          found++;
          break;
        }
      }

      if (!found) {
        var newIndex = addCylinder("Stage", false);
        cylTable.rows[newIndex].cells[1].firstElementChild.value = mix.shortName();
      }
    } // mix.MOD < maxDepth
  } // isNaN(maxDepth)

  sortCylinders();
  return;
}

// Adjust the cylinder select menu for the back gas cylinder (the first one in the table)
// If the maximum depth is > 130 FSW disable all but doubles

function adjustBackGasCylSelect()
{
  var cylTable = document.getElementById("addCylindersHere");
  var maxDepth = parseFloat(document.getElementById("MaxDepth").value);

  // Disable single cylinders for backgas if the depth > 130

  var backGasCyls = cylTable.rows[0].cells[0].firstElementChild;

  for (var i = 1;  i < backGasCyls.options.length; i++) {
    backGasCyls.options[i].disabled = maxDepth > 130 && !Cylinders[backGasCyls.options[i].value].Doubles;
    if (backGasCyls.options[i].disabled && backGasCyls.options[i].selected)
      backGasCyls.selectedIndex = 0;
  }
  return;
}

// Delete a cylinder from the table. Input is only present on stage cylinders that aren't in use.

function deleteThisCylinder(input)
{
  var row = input.parentElement.parentElement;  // parent = <td>, grandparent = <tr>, great grandparent = <tbody>
  var tbody = row.parentElement;

  tbody.deleteRow(row.rowIndex - 1);
  return;
}

// Apportion the required gas volume among cylinders

function gasVolume()
{
  var mixTable = document.getElementById("addGassesHere");
  var cylTable = document.getElementById("addCylindersHere");
  var gasRule = document.querySelector('input[name="GasRule[]"]:checked');
  var bgCylInput = cylTable.rows[0].cells[0].firstElementChild;

  // Mix table cells
  //  0 - Gas Mix
  //  1 - Required volume (including reserve)
  //
  // Cylinder table cells
  //  0 - Cylinder select input (firstElementChild)
  //  1 - Mix input (firstElementChild)
  //  2 - Fill pressure input (firstElementChild)
  //  3 - Reserve pressure
  //  4 - "delete" checkbox
  //
  // The first row in each table is back gas / bottom mix
  // Subsequent rows are stages / deco gas

  var defaultDoubles = "d80";
  var defaultBottomStage = "al80";
  var defaultDecoStage = "al40";
  var defaultBiggerStage = "al80";
  var minPSI = 200;

  var smallStage = Cylinders[defaultDecoStage];
  var bigStage = Cylinders[defaultBiggerStage];

  var smallStageWorkingVolume = smallStage.computeGasUse(smallStage.Pressure - minPSI);
  var bigStageWorkingVolume = bigStage.computeGasUse(bigStage.Pressure - minPSI);

  // First, deal with backgas.  Reserve gas goes in the backgas cylinders;  the rest comes from
  // both backgas cylinders (if can) and stages.  If we don't have enough gas for both reserve
  // and gas needed for the dive, add bottom stage(s) as necessary.

  var bottomGasTotal = parseFloat(mixTable.rows[0].cells[1].innerHTML);
  var bottomGasDive = bottomGasTotal;
  var bottomGasReserve = 0;
  var bottomGasMixName = mixTable.rows[0].cells[0].innerHTML;
  if (bottomGasMixName == "&nbsp;")  // sorry.
    bottomGasMixName = "";

  // Compute the bottom gas reserve and bottom gas needed

  switch (gasRule.value) {
    default:
    case "All":
      break;

    case "Half":
      bottomGasReserve = bottomGasTotal / 2;
      bottomGasDive = bottomGasTotal / 2;
      break;

    case "Thirds":
      bottomGasReserve = (bottomGasTotal * 2) / 3;
      bottomgasDive = bottomGasTotal / 3;
      break;
  }

  // See if we have a backgas cylinder nominated

  var bgCyl = null;
  var bgFillPel = cylTable.rows[0].cells[2].firstElementChild;

  if (bgCylInput.selectedIndex)
    bgCyl = Cylinders[bgCylInput.value];

  // If we don't have a backgas cylinder, nominate the default

  if (!bgCyl) {
    bgCylInput.selectedIndex = findSelectIndex(bgCylInput, defaultDoubles);
    bgCyl = Cylinders[defaultDoubles];
    if (!bgFillPel.value)
      bgFillPel.value = bgCyl.Pressure.toFixed();    // Default to full
  }

  // Figure out our working backgas volume (fill pressure - min pressure) in the nominated cylinder

  var bgWorkingPressure = parseFloat(bgFillPel.value) - minPSI;
  var bgWorkingVolume = bgCyl.computeGasUse(bgWorkingPressure);
  var bottomStagesWorkingVolume = 0;

  var pruneCylinders = Array();
  var bottomCylinders = Array();

  // Put our backgas cylinders in the array

  bottomCylinders.push({cylTableIndex: 0,
                        cylinder: bgCyl,
                        workingPressure: bgWorkingPressure,
                        workingVolume: bgWorkingVolume,
                        fillPressure: parseFloat(bgFillPel.value),
                        reservePressure: cylTable.rows[0].cells[3]});

  // Find any bottom stages

  var bgNeededVolume = bottomGasTotal - bgWorkingVolume;

  for (var i = 1; i < cylTable.rows.length; i++) {
    if (cylTable.rows[i].cells[1].firstElementChild.value != bottomGasMixName)
      continue;
    if (bgNeededVolume <= 0)
      pruneCylinders.push(i);
    else {
      var cylSelect = cylTable.rows[i].cells[0].firstElementChild;
      var fillP = cylTable.rows[i].cells[2].firstElementChild;

      if (cylTable.rows[i].cells[1].firstElementChild.value == bottomGasMixName) {

        // Make sure we have a nominated cylinder;  nominate the default bottom stage if not

        if (cylSelect.selectedIndex == 0)
          cylSelect.selectedIndex = findSelectIndex(cylSelect, defaultBottomStage);

        var stage = Cylinders[cylSelect.value];

        // Default to full if no fill pressure

        if (!fillP.value)
          fillP.value = stage.Pressure.toFixed();

        var stageWorkingPressure = roundDown(parseFloat(fillP.value) - minPSI, 100);
        var stageWorkingVolume = stage.computeGasUse(stageWorkingPressure);

        bottomStagesWorkingVolume += stageWorkingVolume;
        bottomCylinders.push({cylTableIndex: i,
                              cylinder: stage,
                              workingPressure: stageWorkingPressure,
                              workingVolume: stageWorkingVolume,
                              fillPressure: stageWorkingPressure + minPSI,
                              reservePressure: cylTable.rows[i].cells[3]});
      } // if bottomGasMixName
    } // else
  } // for

  // Do we need add any more bottom stages?

  while (bottomGasTotal > bgWorkingVolume + bottomStagesWorkingVolume) {

   // Yes, add a new bottom stage

   var newIndex = addCylinder("Stage", false);
   var cylSelect = cylTable.rows[newIndex].cells[0].firstElementChild;
   var fillP = cylTable.rows[newIndex].cells[2].firstElementChild;

   // Set the gas mixture and nominate the default bottom cylinder, and make it full

   cylTable.rows[newIndex].cells[1].firstElementChild.value = bottomGasMixName != "&nbsp;" ? bottomGasMixName : "";  // sorry.
   cylSelect.selectedIndex = findSelectIndex(cylSelect, defaultBottomStage);
   var stage = Cylinders[cylSelect.value];
   fillP.value = stage.Pressure.toFixed();

   // Add this to the quiver of bottom stages

   var stageWorkingPressure = roundDown(stage.Pressure - minPSI, 100);
   var stageWorkingVolume = stage.computeGasUse(stageWorkingPressure);

   bottomStagesWorkingVolume += stageWorkingVolume;

   bottomCylinders.push({cylTableIndex: newIndex,
                         cylinder: stage,
                         workingPressure: stageWorkingPressure,
                         workingVolume: stageWorkingVolume,
                         fillPressure: stageWorkingPressure + minPSI,
                         reservePressure: cylTable.rows[newIndex].cells[3]});
  } // while

  // Ok, at this point we have enough cylinders to cover our bottom gas requirement.

  for (var i = 0; i < bottomCylinders.length; i++) {
    if (bottomGasReserve <= 0)
      bottomCylinders[i].reservePressure.innerHTML = minPSI.toFixed();
    else {
      var reservePressure = Math.min(bottomCylinders[i].cylinder.cuFtToPSI(bottomGasReserve), bottomCylinders[i].workingPressure);
      var reserveVolume = bottomCylinders[i].cylinder.computeGasUse(reservePressure);
      var useableGasPSI = bottomCylinders[i].workingPressure - reservePressure;

      bottomCylinders[i].reservePressure.innerHTML = Math.min(roundUp(bottomCylinders[i].fillPressure - useableGasPSI, 100), bottomCylinders[i].fillPressure).toFixed();
      bottomGasReserve -= reserveVolume;
    }
  }

  // Onward to the deco gasses (if any)

  var decoMixes = Array();

  for (var mixIndex = 1; mixIndex < mixTable.rows.length; mixIndex++) {
    var mixTotalVolume = parseFloat(mixTable.rows[mixIndex].cells[1].innerHTML);
    var mixDive = mixTotalVolume;
    var mixReserve = 0;

    // Compute the gas needed and reserve

    switch (gasRule.value) {
      default:
      case "All":
        break;

      case "Half":
        mixReserve = mixTotalVolume / 2;
        mixDive = mixTotalVolume / 2;
        break;

      case "Thirds":
        mixReserve = (mixTotalVolume * 2) / 3;
        mixDive = mixTotalVolume / 3;
        break;
    }

    // Find the cylinder table entry(ies) for this mixture

    var mixCylinders = Array();
    var stageWorkingVolume = 0;
    var nSmallStages = 0;

    for (var i = 1; i < cylTable.rows.length; i++) {
      if (cylTable.rows[i].cells[1].firstElementChild.value == mixTable.rows[mixIndex].cells[0].innerHTML) {

        // Nominate a deco cylinder if we don't have one

        var cylSelect = cylTable.rows[i].cells[0].firstElementChild;
        var fillP = cylTable.rows[i].cells[2].firstElementChild;

        if (cylSelect.selectedIndex == 0) {

          // Figure out if we can get away with a small stage

          if (mixTotalVolume <= smallStageWorkingVolume)
            cylSelect.selectedIndex = findSelectIndex(cylSelect, defaultDecoStage);
          else
            cylSelect.selectedIndex = findSelectIndex(cylSelect, defaultBiggerStage);

          fillP.value = Cylinders[cylSelect.value].Pressure.toFixed(); // make it full

        } // selectedIndex

        var stage = Cylinders[cylSelect.value];
        var fillPressure = parseFloat(fillP.value);
        stageWorkingVolume += stage.computeGasUse(fillPressure - minPSI);
        if (stage.Volume <= smallStage.Volume)
          nSmallStages++;

        mixCylinders.push({cylTableRow: i,
                           cyl: stage,
                           cylVolume: stage.Volume,
                           workingPressure: fillPressure - minPSI,
                           workingVolume: stage.computeGasUse(fillPressure - minPSI),
                           fillPressure: fillPressure,
                           reservePressure: cylTable.rows[i].cells[3]});
      }
    } // for cylTable

    decoMixes.push({mixName: mixTable.rows[mixIndex].cells[0].innerHTML,
                    diveVolume: mixDive,
                    reserveVolume: mixReserve,
                    cylInfo: mixCylinders});
  } // for mixTable

  // Ok, at this point we have amassed a collection of deco gasses and stages.
  // Now see if we have enough stages for each gas to cover the required volume.

  for (var i = 0; i < decoMixes.length; i++) {
    var neededVolume = decoMixes[i].diveVolume + decoMixes[i].reserveVolume;

    for (var j = 0; j < decoMixes[i].cylInfo.length; j++) {
      if (neededVolume <= 0)
        pruneCylinders.push(decoMixes[i].cylInfo[j].cylTableRow);  // Definitely don't need this stage any longer
      else {
        var dCylInfo = decoMixes[i].cylInfo[j];
        neededVolume -= dCylInfo.workingVolume;

        // If our needed volume winds up negative then this cylinder may be too
        // big for our needs.  Demote it to a small stage if we can (i.e.,
        // needed volume is <= small stage working volume - note the way we
        // check for this...)

        if (neededVolume < 0 &&
            dCylInfo.workingVolume > smallStageWorkingVolume &&
            Math.abs(neededVolume) >= smallStageWorkingVolume) {  // or  neededVolume <= -smallStageWorkingVolume

          // Demote this big stage into a small one.  Note that this is only done for deco stages.

          dCylInfo.stage = smallStage;
          dCylInfo.cylVolume = smallStage.volume;
          dCylInfo.workingPressure = smallStage.Pressure - minPSI;
          dCylInfo.workingVolume = smallStageWorkingVolume;
          dCylInfo.fillPressure = smallStage.Pressure;

          var row = cylTable.rows[dCylInfo.cylTableRow];
          var cylSelect = row.cells[0].firstElementChild;
          cylSelect.selectedIndex = findSelectIndex(cylSelect, defaultDecoStage);
        } // neededVolume < 0
      } // else nddedVolume <= 0
    } // for

    // If we need more volume and have some small stages, promote them to bigger stages

    if (neededVolume > 0 && nSmallStages > 0) {

      // Promote small stages into bigger ones

      for (var i = 0; i < decoMixes.length; i++) {
        var cyls = decoMixes[i].cylInfo;

        for (var j = 0; j < cyls.length; j++) {
          if (cyls[j].cylVolume < bigStage.Volume) {
            var row = cylTable.rows[cyls[j].cylTableRow];
            var cylSelect = row.cells[0].firstElementChild;

            neededVolume -= bigStageWorkingVolume - cyls[j].workingVolume;

            // Make this a bigger stage, and make it full while we're at it.
            // Note that this is only done for deco stages.

            cylSelect.selectedIndex = findSelectIndex(cylSelect, defaultBiggerStage);
            cyls[j].stage = bigStage;
            cyls[j].cylVolume = bigStage.Volume;
            cyls[j].workingPressure = bigStage.Pressure - minPSI;
            cyls[j].workingVolume = bigStageWorkingVolume;
            cyls[j].fillPressure = bigStage.Pressure;
            if (neededVolume <= 0)
              break;
          } // smallStage
        } // for cyls

        if (neededVolume <= 0)
          break;
      } // for decoMixes
    } // if nSmallStages

    // Add more stages if we still need more volume

    while (neededVolume > 0) {
      var newIndex = addCylinder("Stage", false);
      var cylSelect = cylTable.rows[newIndex].cells[0].firstElementChild;
      var fillP = cylTable.rows[newIndex].cells[2].firstElementChild;

      // Set the gas mixture and figure out if we can get away with a small stage

      cylTable.rows[newIndex].cells[1].firstElementChild.value = decoMixes[i].mixName;

      if (neededVolume <= smallStageWorkingVolume)
        cylSelect.selectedIndex = findSelectIndex(cylSelect, defaultDecoStage);
      else
        cylSelect.selectedIndex = findSelectIndex(cylSelect, defaultBiggerStage);

      var stage = Cylinders[cylSelect.value];
      fillP.value = stage.Pressure.toFixed();

      var stageWorkingVolume = stage.computeGasUse(stage.Pressure - minPSI);
      var stageWorkingPressure = stage.Pressure - minPSI;

      neededVolume -= stageWorkingVolume;
      decoMixes[i].cylInfo.push({cylTableRow: newIndex,
                                 cyl: stage,
                                 workingPressure: stage.Pressure - minPSI,
                                 workingVolume: stageWorkingVolume,
                                 fillPressure: stageWorkingPressure + minPSI,
                                 reservePressure: cylTable.rows[newIndex].cells[3]});
    } // while
  } // for decoMixes

  // Now we have enough cylinders on hand for all of our deco gas needs.
  // Compute reserve pressures

  for (var i = 0; i < decoMixes.length; i++) {
    var cylInfo = decoMixes[i].cylInfo;
    var decoGasReserve = decoMixes[i].reserveVolume;

    for (var j = 0; j < cylInfo.length; j++) {
      if (decoGasReserve <= 0)
        cylInfo[j].reservePressure.innerHTML = minPSI.toFixed();
      else {
        var reservePressure = Math.min(cylInfo[j].cyl.cuFtToPSI(decoMixes[i].reserveVolume), cylInfo[j].workingPressure);
        var reserveVolume = cylInfo[j].cyl.computeGasUse(reservePressure);
        var useableGasPSI = cylInfo[j].workingPressure - reservePressure;

        cylInfo[j].reservePressure.innerHTML = Math.min(roundUp(cylInfo[j].fillPressure - useableGasPSI, 100), cylInfo[j].fillPressure).toFixed();
        decoGasReserve -= reserveVolume;
      }
    } // for cylInfo
  } // for decoMixes

  // Prune any unecessary cylinders

  pruneCylinders.sort(function(a, b) { return(b-a); });      // Sort in reverse order
  for (var i = 0; i < pruneCylinders.length; i++)
    cylTable.deleteRow(pruneCylinders[i]);

  sortCylinders();
  return;
}

// Compute the dive plan

function divePlan()
{
  var bottomTime = parseFloat(document.getElementById("BottomTime").value);
  var neededGasCF = document.getElementById("neededGasCF");

  // Next we need the table populated with stop info

  var table = document.getElementById("addRowsHere");
  if (table.rows.length > 0 && !isNaN(bottomTime) && bottomTime > 0) {

    // Choose the larger of the bottom time input or the time input at the bottom of the schedule

    var sBottomTime = parseFloat(table.rows[table.rows.length - 1].cells[2].firstElementChild.value);
    if (!isNaN(sBottomTime))
      bottomTime = Math.max(bottomTime, sBottomTime);

    // Ok, we should (in theory) have some stops.  Compute the gas requirements:
    // At each stop, ATA * SCR * Stop time
    //
    // Compute the total ascent time and TTS (the latter includes the bottom time)

    // Make sure that the last stop includes the bottom time
    // (in case it changed and that's why we're here)

    table.rows[table.rows.length - 1].cells[2].firstElementChild.value = bottomTime.toFixed();
    document.getElementById("BottomTime").value = bottomTime.toFixed();

    var gasNeeded = 0.0;
    var ascentTime = 0;
    var diveSCR = parseFloat(document.getElementById("diveSCR").value);
    var decoSCR = parseFloat(document.getElementById("decoSCR").value);
    var cns = 0.0;
    var otus = 0.0;

    // Walk the table computing gas requirements at each stop

    for (var i = 0; i < table.rows.length; i++) {
      var row = table.rows[i];

      // Row cells:
      //  0  - Pressure in ATA
      //  1  - Depth in FSW
      //  2  - Stop time input (firstElementChild)
      //  3  - Run time
      //  4  - Cubic Feet of gas needed
      //  5  - Cubic Feet of reserve gas
      //  6  - Gas mixture
      //  7  - PO2
      //  8  - END
      //  9  - CNS
      //  10 - OTUs

      var ata = parseFloat(row.cells[0].innerHTML);
      var stopCell = row.cells[2];
      var stopTime = parseFloat(stopCell.firstElementChild.value);
      var runCell = row.cells[3];
      var cuFtCell = row.cells[4];
      var reserveCell = row.cells[5];
      var mixCell = row.cells[6];
      var pO2cell = row.cells[7];
      var endCell = row.cells[8];
      var cnsCell = row.cells[9];
      var otuCell = row.cells[10];

      if (!isNaN(stopTime) && stopTime > 0) {
        var stopGas = ata * stopTime * (i != table.rows.length - 1 ? decoSCR : diveSCR);
        var stopReserve = reserveGas(stopGas);
        var pO2 = parseFloat(pO2cell.innerHTML);

        gasNeeded += stopGas + stopReserve;
        ascentTime += stopTime;
        if (i != table.rows.length - 1)
          ascentTime++;  // include time to next stop unless this is the bottom, will compute time to first stop (ttfs) in a bit
        cuFtCell.innerHTML = stopGas.toFixed(1);
        if (stopReserve > 0.0)
          reserveCell.innerHTML = stopReserve.toFixed(1);
        else
          reserveCell.innerHTML = "";

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
    var maxPO2 = parseFloat(table.rows[table.rows.length - 1].cells[7].innerHTML);
    var minPO2 = 0.0;

    // Search for the first stop starting at the end of the table

    for (var i = table.rows.length - 2; i > 0; i--) {
      if (table.rows[i].cells[2].firstElementChild.value) {
        firstStop = (i + 1) * 10.0;
        minPO2 = parseFloat(table.rows[i].cells[7].innerHTML);
        break;
      }
    }

    var ttfs = Math.ceil((maxDepth - firstStop) / 30.0);
    var avgATA = (((maxDepth + firstStop) / 2) / 33.0) + 1.0;
    ascentTime += ttfs;

    // Gas needed for the portion of the ascent to the first stop

    var gasttfs = avgATA * diveSCR * ttfs;
    var reserveGasttfs = reserveGas(gasttfs);
    gasNeeded += gasttfs + reserveGasttfs;

    // Compute the gas needed for the descent portion

    var descentRate = parseFloat(document.getElementById("DescentRate").value);
    var descentTime = Math.ceil(maxDepth / descentRate);

    document.getElementById("descentTime").value = descentTime.toFixed();

    avgATA = ((maxDepth / 2) / 33.0) + 1.0;
    var descentGas = avgATA * diveSCR * descentTime;
    var reserveDescentGas = reserveGas(descentGas);

    gasNeeded += descentGas + reserveDescentGas;

    // Ok, at this point we know how much gas we need

    neededGasCF.value = gasNeeded.toFixed(1);

    // Park the gas needed for the ascent to the first stop at the next deeper
    // stop depth in the table

    var r = table.rows[(firstStop / 10)];
    r.cells[4].innerHTML = gasttfs.toFixed(1);
    if (reserveGasttfs > 0.0)
      r.cells[5].innerHTML = reserveGasttfs.toFixed(1);
    else
      r.cells[5].innerHTML = "";

    // If we know the max and min PO2 information, park the CNS and OTU information
    // in the same row

    if (!isNaN(maxPO2) && maxPO2 > 0.5 && !isNaN(minPO2)) {
      var ascCNS = calcCNS(((maxPO2 + minPO2) / 2), ttfs);
      var ascOTUs = calcOTUs(ttfs, maxPO2, minPO2);

      // Ascent exposure

      cns += ascCNS;
      otus += ascOTUs;

      r.cells[9].innerHTML = ascCNS.toFixed(2);
      r.cells[10].innerHTML = ascOTUs.toFixed(1);

      // Compute the CNS and OTUs for the descent portion of the dive

      minPO2 = 0.0;
      for (var i = 0; i < table.rows.length; i++) {
        var stopPO2 = parseFloat(table.rows[i].cells[7].innerHTML);
        if (!isNaN(stopPO2) && stopPO2 > 0) {
          minPO2 = stopPO2;
          break;
        }
      }

      var descentCNS = calcCNS(((maxPO2 + minPO2) / 2), descentTime);
      var descentOTUs = calcOTUs(descentTime, maxPO2, minPO2);

      cns += descentCNS;
      OTUs += descentOTUs;

      // Add the descent oxygen exposure to the bottom time element

      var row = table.rows[table.rows.length - 1];
      row.cells[9].innerHTML = (descentCNS + parseFloat(row.cells[9].innerHTML)).toFixed(2);
      row.cells[10].innerHTML = (descentOTUs + parseFloat(row.cells[10].innerHTML)).toFixed(1);

    }

    // Total CNS and OTUs for the dive

    if (cns > 0.0)
      document.getElementById("CNS").value = cns.toFixed(1);
    if (otus > 0.0)
      document.getElementById("OTUs").value = otus.toFixed(1);

    // Walk down the remaining stop times until we hit the bottom and park an up arrow in the gas demand column
    // Park an up arrow in the reserve gas column if the gas rule is anything other than all useable
    // Park an up arrow in the CNS and OTU columns if the CNS and OTUs for the ascent are known

    for (var i = (firstStop / 10) + 1; i < table.rows.length - 1; i++) {
      table.rows[i].cells[4].innerHTML = "&uarr;";
      table.rows[i].cells[5].innerHTML = !document.getElementById("AllUseable").checked ? "&uarr;" : "";
      table.rows[i].cells[9].innerHTML = table.rows[(firstStop / 10)].cells[9].innerHTML != "" ? "&uarr;" : "";
      table.rows[i].cells[10].innerHTML = table.rows[(firstStop / 10)].cells[10].innerHTML != "" ? "&uarr;" : "";
    }

    // Park the descent time in the run time column at the bottom

    table.rows[table.rows.length - 1].cells[3].innerHTML = descentTime.toFixed();

    // Walk the table from the first stop up, computing the run time

    var runTime = descentTime + bottomTime + ttfs;
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
    document.getElementById("ascentTime").value = (ascentTime - bottomTime).toFixed();

    // Now walk the gas mix table, and update totals

    var mixTable = document.getElementById("addGassesHere");
    if (mixTable.rows.length > 0) {

      // Collect all the mixes into an object
      //
      // Object properties are the names of the mixes;  the values are the total gas required

      var mixes = {};

      for (var i = 0; i < mixTable.rows.length; i++) {
        var mixKey = mixTable.rows[i].cells[0].innerHTML;
        if (mixKey == "" || mixKey == "&nbsp;")
          mixKey = "bottomMix";     // sorry.
        if (!mixes.propertyIsEnumerable[mixKey])
          mixes[mixKey] = 0.0;
      }

      // Add up the gas requirements

      for (var i = 0; i < table.rows.length; i++) {
        var mixKey = table.rows[i].cells[6].firstElementChild.value;
        var gas = parseFloat(table.rows[i].cells[4].innerHTML);
        var reserve = parseFloat(table.rows[i].cells[5].innerHTML);
        if (!isNaN(gas)) {
          if (!isNaN(reserve))
            gas += reserve;
          if (mixKey == "" || mixKey == "&nbsp;")
            mixKey = "bottomMix";     // sorry.
          mixes[mixKey] += gas;
        } // NaN(gas)
      } // for

      // Update the mix table with the required gas volume for each mix

      for (var i = 0; i < mixTable.rows.length; i++) {
        var mixKey = mixTable.rows[i].cells[0].innerHTML;
        if (mixKey == "" || mixKey == "&nbsp;")
          mixKey = "bottomMix";       // sorry.
        mixTable.rows[i].cells[1].innerHTML = mixes[mixKey].toFixed(1);
      }

      // Now see if we have enough gas in our cylinders for our needs

      gasVolume();

    } // mixTable.rows.length > 0
  } // for table.rows.length
  return;
}

// Compute the reserve gas necessary based on gas usage rules
// (All, Half, Thirds)

function reserveGas(cuFt)
{
  var reserveGas = 0.0;
  var gasRule = document.querySelector('input[name="GasRule[]"]:checked');

  if (gasRule) {
    switch (gasRule.value) {
      default:
      case "All":
        break;
      case "Half":
        reserveGas = cuFt;
        break;
      case "Thirds":
        reserveGas = cuFt * 2.0;
        break;
    }
  }
  return(reserveGas);
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
  divePlan();
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

  // Empty the gas mixture table down to the bottom mix

  var mixTable = document.getElementById("addGassesHere");
  for (var i = mixTable.rows.length - 1; i > 0; i--)
    mixTable.deleteRow(i);
  mixTable.rows[0].cells[0].innerHTML = "&nbsp;";
  mixTable.rows[0].cells[1].innerHTML = "";

  // Pare the cylinders table down to just the backgas

  var cylTable = document.getElementById("addCylindersHere");
  for (var i = cylTable.rows.length -1; i > 0; i--)
    cylTable.deleteRow(i);
  cylTable.rows[0].cells[0].firstElementChild.selectedIndex = 0; // Unselect any backgas cylinder
  cylTable.rows[0].cells[1].firstElementChild.value = "";        // Mix input
  cylTable.rows[0].cells[2].firstElementChild.value = "";        // Fill pressure
  cylTable.rows[0].cells[3].value = "";                          // Reserve pressure
  adjustBackGasCylSelect();                                      // Prune singles from options list if deep dive

  // Populate the depth table

  for (var i = 0; i < maxDepth / 10; i++) {

    var row = table.insertRow(i);

    var ataCell = row.insertCell(0);
    var depthCell = row.insertCell(1);
    var timeCell = row.insertCell(2);
    var runCell = row.insertCell(3);
    var cuFtCell = row.insertCell(4);
    var reserveCell = row.insertCell(5);
    var mixCell = row.insertCell(6);
    var pO2Cell = row.insertCell(7);
    var endCell = row.insertCell(8);
    var cnsCell = row.insertCell(9);
    var otuCell = row.insertCell(10);

    ataCell.style.textAlign = "center";
    depthCell.style.textAlign = "center";
    timeCell.style.textAlign = "center";
    runCell.style.textAlign = "center";
    cuFtCell.style.textAlign = "center";
    reserveCell.style.textAlign = "center";
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
    timeInput.onchange = function() { var rowIndex = this.parentElement.parentElement.rowIndex;
                                      var tableLength = this.parentElement.parentElement.parentElement.rows.length;
                                      if (rowIndex != tableLength)
                                        document.getElementById("nominal").checked = false;
                                      else
                                        processBottomTime(this);
                                      divePlan();
                                      return;
                                     };
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
  var bTime = parseFloat(document.getElementById("BottomTime").value);

  var ascentInfo = nominalAscent();
  firstStop = ascentInfo.firstStop;
  TTS = ascentInfo.TTS;
  ascentTime = ascentInfo.ascentTime;

  if (firstStop == 0) {

    // Set the bottom time element to the bottom time

    table.rows[table.rows.length - 1].cells[2].firstElementChild.value = bTime.toFixed();
    TTS += bTime;

    // Calculate the time to the first stop

    var ttfs = Math.ceil((maxDepth - firstStop) / 30.0);

    TTS += ttfs;
    ascentTime += ttfs;
  }
  document.getElementById("TTS").value = TTS.toFixed();
  document.getElementById("ascentTime").value = ascentTime.toFixed();

  divePlan();
  return;
}

// Process a change in the bottom time input

function processBottomTime(input)
{
  var bottomTime = parseFloat(input.value);

  if (isNaN(bottomTime) || bottomTime < 1.0 || bottomTime > 300.0) {
    alert("Please enter a value between 1 and 300");
    input.select();
    input.focus();
    return;
  }

  var bottomTimeInput = document.getElementById("BottomTime");
  var table = document.getElementById("addRowsHere");
  var tableBottomTimeInput = table.rows[table.rows.length - 1].cells[2].firstElementChild;

  // Make the two inputs match

  if (input == bottomTimeInput)
    tableBottomTimeInput.value = bottomTime.toFixed();
  else
    bottomTimeInput.value = bottomTime.toFixed();

  divePlan();
  return;
}

// Populate the stop table with a nominal ascent profile

function nominalAscent()
{
  var ascentInfo = {firstStop: 0, TTS: 0, ascentTime: 0};
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
        ascentInfo.ascentTime += 3 + 1;

      } else if (i == (firstStop / 10.0) - 1) {

        // First stop

        tCellInput.value = "1";
        ascentInfo.TTS++;        // don't include time to next stop for the first stop
        ascentInfo.ascentTime++;

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

          // Set the bottom time element to the bottom time

          var bTime = parseFloat(document.getElementById("BottomTime").value);
          tCellInput.value = bTime.toFixed();
          ascentInfo.TTS += bTime;

          // Include ascent time to first stop

          var ttfs = Math.ceil((maxDepth - firstStop) / 30.0);

          ascentInfo.TTS += ttfs;
          ascentInfo.ascentTime += ttfs;

        } // i < table.rows.length
      } // else i < firstStop / 10
    } // for
  } // nominal.checked
  divePlan();
  return (ascentInfo);
}

// Add a gas to the gas mixture table

function addMix(input)
{
  var depthTable = document.getElementById("addRowsHere");

  // Don't bother if we haven't set the maximum depth (i.e., created the depth table)

  if (depthTable.rows.length == 0) {
    input.value = "";
    return;
  }

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

      // This function gets called from three places - one from the schedule table input,
      // another is the add a mixture input at the bottom of the form, and the last case
      // is from adding a cylinder.  In the first case we'll assume that we're going to
      // start using the mix at the current depth in the table.  In the latter cases we'll
      // assume that we're going to start using the new mix at its MOD.

      findOrAddCyl(mix);  // Make sure we have a cylinder with this mix

      var depthRowIndex = 0;

      if (input.id == "mixTextInput" || input.id.indexOf("cylMix") == 0)
        depthRowIndex = Math.min((roundDown(mix.MOD(maxATA(mix)), 10) / 10.0), depthTable.rows.length) - 1;
      else
        depthRowIndex = input.parentElement.parentElement.rowIndex - 1; // parent = cell, grandparent = row

      // Before adding a new row, check to see if we're a candidate for the bottom mix

      var row = mixTable.rows[0];
      var mixCell = row.cells[0];
      var cuFtCell = row.cells[1];

      if (depthRowIndex != depthTable.rows.length - 1) {
        row = mixTable.insertRow(-1);
        mixCell = row.insertCell(0);
        cuFtCell = row.insertCell(1);

        mixCell.style.textAlign = "center";
        cuFtCell.style.textAlign = "center";

      } else {

        // We're the bottom mix.  Update any bottom stages as well

        var cylTable = document.getElementById("addCylindersHere");

        for (var j = 1; j < cylTable.rows.length; j++) {
          var cylMixInput = cylTable.rows[j].cells[1].firstElementChild;

          if (!cylMixInput.value || cylMixInput.value == "&nbsp;")
            cylMixInput.value = input.value;
        }
      }
      mixCell.innerHTML = input.value;

      // Start from the current spot and work shallower

      for (var i = depthRowIndex; i >= 0; i--) {

        var mixCell = depthTable.rows[i].cells[6];
        var timeCell = depthTable.rows[i].cells[2];
        var pO2Cell = depthTable.rows[i].cells[7];
        var endCell = depthTable.rows[i].cells[8];
        var cnsCell = depthTable.rows[i].cells[9];
        var otuCell = depthTable.rows[i].cells[10];

        var depth = (i + 1) * 10.0;

        if (!mixCell.firstElementChild.value) {                         // New mix
          mixCell.firstElementChild.value = input.value;

          // Force a 1 minute stop at a mix change unless we've already got a stop there (ignore the bottom)

          if (depthRowIndex < depthTable.rows.length - 1 && timeCell.firstElementChild.value == "") {
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
      divePlan();

    } else {  // !found

      // If we're changing a mix in the table, adjust the colors for PO2, END warnings

      if (input.id != "mixTextInput") {

        var depthRowIndex = input.parentElement.parentElement.rowIndex - 1;  // parent = cell, grandparent = row
        var timeCell = depthTable.rows[depthRowIndex].cells[2];
        var mixCell = depthTable.rows[depthRowIndex].cells[6];
        var pO2Cell = depthTable.rows[depthRowIndex].cells[7];
        var endCell = depthTable.rows[depthRowIndex].cells[8];
        var cnsCell = depthTable.rows[depthRowIndex].cells[9];
        var otuCell = depthTable.rows[depthRowIndex].cells[10];

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

      divePlan();

    }  // !found

  } else {  // bad mix
    alert("Please enter a valid gas mixture");
    input.select();
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
  } else if (maxDepth <= 100.0) {

    // 100 FSW - 32%

    mixTextInput.value = "32";
    addMix(mixTextInput);

  } else if (maxDepth <= 165.0) {

    // 165 FSW - 21/35, 50% and O2

    mixTextInput.value = "21/35";
    addMix(mixTextInput);
    mixTextInput.value = "50";
    addMix(mixTextInput);
    mixTextInput.value = "O2";
    addMix(mixTextInput);

  } else if (maxDepth <= 220.0) {

    // 220 FSW - 18/45, 50% and O2

    mixTextInput.value = "18/45";
    addMix(mixTextInput);
    mixTextInput.value = "50";
    addMix(mixTextInput);
    mixTextInput.value = "O2";
    addMix(mixTextInput);

  } else if (maxDepth <= 270.0) {

    // 270 FSW - 15/55, 35/25 and O2

    mixTextInput.value = "15/55";
    addMix(mixTextInput);
    mixTextInput.value = "35/25";
    addMix(mixTextInput);
    mixTextInput.value = "O2";
    addMix(mixTextInput);

  } else if (maxDepth <= 350.0) {

    // 350 FSW - 12/65, 21/35, 35/25 and O2

    mixTextInput.value = "12/65";
    addMix(mixTextInput);
    mixTextInput.value = "21/35";
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
    return(1.42);
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

  if (mixTable.rows.length > 1) {
    for (var i = 0; i < mixTable.rows.length; i++)
      mixArray[i] = Array(mixTable.rows[i].cells[0].innerHTML,   // Gas Mix
                          mixTable.rows[i].cells[1].innerHTML);  // Volume needed

    mixArray.sort(byMODhighToLow);

    for (var i = 0; i < mixArray.length; i++) {
      mixTable.rows[i].cells[0].innerHTML = mixArray[i][0];      // Gas mix
      mixTable.rows[i].cells[1].innerHTML = mixArray[i][1];      // Volume needed
    }
  }
  return;
}

// Ranking function to sort a gas mixture by MOD - high to low

function byMODhighToLow(a, b)
{
  // a and b are arrays
  //  0 - mix name
  //  1 - volume needed
  //
  // It is possible to have a null mix (e.g, when we've not yet selected a bottom mix)

  var mixA = ParseMix(a[0]);
  var mixB = ParseMix(b[0]);

  if (!mixA || !mixB)
    return(0);
  return(mixB.MOD(1.6) - mixA.MOD(1.6));
}

// Sort the cylinder table by MOD and cylinder size
//
// nb - we only sort the stage cylinders

function sortCylinders()
{
  var cylArray = Array();
  var cylTable = document.getElementById("addCylindersHere");

  if (cylTable.rows.length > 2) {
    for (var i = 1; i < cylTable.rows.length; i++)
      cylArray[i - 1] = Array(cylTable.rows[i].cells[1].firstElementChild.value,          // Gas mix
                              cylTable.rows[i].cells[0].firstElementChild.selectedIndex,  // Cylinder selected index
                              cylTable.rows[i].cells[2].firstElementChild.value,          // Fill pressure
                              cylTable.rows[i].cells[3].innerHTML,                        // Reserve pressure
                              cylTable.rows[i].cells[0].firstElementChild.value);         // Cylinder

    cylArray.sort(byMODandSize);

    for (var i = 1; i < cylTable.rows.length; i++) {
      cylTable.rows[i].cells[1].firstElementChild.value = cylArray[i - 1][0];             // Gas mix
      cylTable.rows[i].cells[0].firstElementChild.selectedIndex = cylArray[i - 1][1];     // Cylinder selected index
      cylTable.rows[i].cells[2].firstElementChild.value = cylArray[i - 1][2];             // Fill pressure
      cylTable.rows[i].cells[3].innerHTML = cylArray[i - 1][3];                           // Reserve pressure
    }
  }
  return;
}

// Ranking function to sort cylinders by mix MOD and size

function byMODandSize(a, b)
{

  // a and b are arrays
  //  0 - Gas mix name
  //  1 - cylinder selected index
  //  2 - fill pressure
  //  3 - reserve pressure
  //  4 - cylinder name

  var mixA = ParseMix(a[0]);
  var mixB = ParseMix(b[0]);
  var cylA = Cylinders[a[4]];
  var cylB = Cylinders[b[4]];

  var rank = 0;
  if (mixA && mixB)
    rank = mixB.MOD(1.6) - mixA.MOD(1.6);
  if (rank == 0)
    rank = cylB.Volume - cylA.volume;
  return(rank);
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
    return(time * percentCNS[((pO2.toFixed(1) - 0.5) * 10).toFixed()]);
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
  var cylTable = document.getElementById("addCylindersHere");

  document.getElementById("MaxDepth").value = "";
  document.getElementById("nominal").checked = false;
  document.getElementById("defaultGasses").checked = false;
  document.getElementById("BottomTime").value = "20";
  document.getElementById("DescentRate").value = "30";
  document.getElementById("diveSCR").value = "0.5";
  document.getElementById("decoSCR").value = "0.5";
  document.getElementById("TTS").value = "";
  document.getElementById("descentTime").value = "";
  document.getElementById("ascentTime").value = "";
  document.getElementById("neededGasCF").value = "";
  document.getElementById("CNS").value = "";
  document.getElementById("OTUs").value = "";
  document.getElementById("AllUseable").checked = true;

  for (var i = stopTable.rows.length - 1; i >= 0; i--)
    stopTable.deleteRow(i);
  for (var i = cylTable.rows.length - 1; i > 0; i--)              // Leave the backgas row there
    cylTable.deleteRow(i);
  for (var i = gasTable.rows.length - 1; i > 0; i--)              // Leave the bottom mix there
    gasTable.deleteRow(i);

  cylTable.rows[0].cells[1].firstElementChild.value = "";         // Mix input
  cylTable.rows[0].cells[2].firstElementChild.value = "";         // Fill pressure
  cylTable.rows[0].cells[3].innerHTML = "";                       // Reserve pressure

  var backGasCyls = cylTable.rows[0].cells[0].firstElementChild;  // Backgas cylinder select
  backGasCyls.selectedIndex = 0;                                  // Unselect any backgas cylinder
  for (var i = 1; i < backGasCyls.options.length; i++)            // Make all cylinders available again
    backGasCyls.options[i].disabled = false;

  gasTable.rows[0].cells[0].innerHTML = "&nbsp;";                 // Lose the bottom gas mix
  gasTable.rows[0].cells[1].innerHTML = "";                       // Required volume
  return;
}

// Find the proper select index for a given input and string

function findSelectIndex(input, string)
{
  var index = 0;
  for (var opt, i = 0; opt = input.options[i]; i++) {
    if (opt.value == string) {
      index = i;
      break;
    }
  }
  return(index);
}

// Round up to the nearest multiple of up

function roundUp(n, up)
{
  if (n % up == 0)
    return(n);
  else
    return(n + (up - (n % up)));
}

// Round down to the nearest multiple of down

function roundDown(n, down)
{
  return(n - (n % down));
}
//</script>
