//<script language="javascript">
// GasMix.js
//
// Gas mixture routines
//
// Author:  Gerard K. Newman, gkn@opua.org
// Date:    9 Aug 2013

// $$$ Default Gas Prices

var DefaultGasPrices = {Oxygen : 1.10,
                        Helium : 4.50,
                        Argon  : 0.75,
                        Air    : 0.15,
                        FOGDiscount : 0.75,
                        COGOxygen : 0.70,
                        COGHelium : 3.28,
                        COGArgon  : 0.30,
                        COGAir    : 0.05};
var GasPricesFetched = 0;

// Function to force the use of the database to supply gas Prices

function GasMixGetGasPricesFromDB()
{
  if (typeof($) !== "undefined" && $.propertyIsEnumerable("getJSON") && !GasPricesFetched) {
    $(document).ready(function() {
      var url = window.location.origin + "/OpuaGetGasPrices.php";
      $.getJSON(url)
       .done(function(data) {
         if (data) {
           DefaultGasPrices.Oxygen = parseFloat(data.Oxygen);
           DefaultGasPrices.Helium = parseFloat(data.Helium);
           DefaultGasPrices.Argon  = parseFloat(data.Argon);
           DefaultGasPrices.Air    = parseFloat(data.Air);
           DefaultGasPrices.FOGDiscount = parseFloat(data.FOGDiscount);
           DefaultGasPrices.COGOxygen = parseFloat(data.COGOxygen);
           DefaultGasPrices.COGHelium = parseFloat(data.COGHelium);
           DefaultGasPrices.COGArgon  = parseFloat(data.COGArgon);
           DefaultGasPrices.COGAir    = parseFloat(data.COGAir);
           GasPricesFetched++;
//           console.log("Gas Prices Fetched");
         } // if data
       }); // .done
    }); // .ready
  } // GasMixUseDB()
  return;
}

// Pass in default gas prices via an object

function GasMixSetDefaultGasPrices(GasPrices)
{
  DefaultGasPrices.Oxygen = parseFloat(GasPrices.Oxygen);
  DefaultGasPrices.Helium = parseFloat(GasPrices.Helium);
  DefaultGasPrices.Argon  = parseFloat(GasPrices.Argon);
  DefaultGasPrices.Air    = parseFloat(GasPrices.Air);
  DefaultGasPrices.FOGDiscount = parseFloat(GasPrices.FOGDiscount);
  DefaultGasPrices.COGOxygen = parseFloat(GasPrices.COGOxygen);
  DefaultGasPrices.COGHelium = parseFloat(GasPrices.COGHelium);
  DefaultGasPrices.COGArgon  = parseFloat(GasPrices.COGArgon);
  DefaultGasPrices.COGAir    = parseFloat(GasPrices.COGAir);
  GasPricesFetched++;
  return;
}

// Constructor for the GasMix object

function GasMix(Type, fO2, fHe)
{
  this.Type = Type;
  this.fO2 = fO2;
  this.fHe = fHe;
  this.fN2 = (((fO2 + fHe) > 0.0) ? (1.0 - (fO2 + fHe)) : 0.0);
  this.fAr = (((fO2 + fHe) === 0.0) ? 1.0 : 0.0);
  this.topMix = (fO2 === 0.0 ? 0.0 : (fO2 / (1.0 - fHe)));
  this.fog = GasMixGetFog();

  this.longName = function() { switch (this.Type) {
                                 case "Nitrox": return("EAN" + (this.fO2 * 100.0).toFixed());
                                 case "Trimix": return("Trimix " + (this.fO2 * 100.0).toFixed() + "/" + (this.fHe * 100.0).toFixed());
                                 case "Heliox": return("Heliox " + (this.fO2 * 100.0).toFixed() + "/" + (this.fHe * 100.0).toFixed());
                                 case "Argon":
                                 case "Air":
                                 case "Oxygen":
                                 case "Helium":
                                 default: return(this.Type);
                               }};
  this.fullName = function() { switch (this.Type) {
                                 case "Nitrox": return("EAN" + (this.fO2 * 100.0).toFixed());
                                 case "Trimix": return("Tx" + (this.fO2 * 100.0).toFixed() + "/" + (this.fHe * 100.0).toFixed());
                                 case "Heliox": return("Hx" + (this.fO2 * 100.0).toFixed() + "/" + (this.fHe * 100.0).toFixed());
                                 case "Argon":
                                 case "Air":
                                 case "Oxygen":
                                 case "Helium":
                                 default: return(this.Type);
                               }};
  this.mediumName = function() { switch (this.Type) {
                                   case "Nitrox": return((this.fO2 * 100.0).toFixed());
                                   case "Trimix":
                                   case "Heliox": return((this.fO2 * 100.0).toFixed() + "/" + (this.fHe * 100.0).toFixed());
                                   case "Air":
                                   case "Argon":
                                   case "Oxygen":
                                   case "Helium":
                                   default: return(this.Type);
                                 }};
  this.shortName = function() { switch (this.Type) {
                                  case "Air":
                                  case "Nitrox": return((this.fO2 * 100.0).toFixed());
                                  case "Trimix":
                                  case "Heliox": return((this.fO2 * 100.0).toFixed() + "/" + (this.fHe * 100.0).toFixed());
                                  case "Argon": return("Ar");
                                  case "Oxygen": return("O2");
                                  case "Helium": return("He");
                                  default: return(this.Type);
                                }};
  this.sarcasticName = function() { switch (this.Type) {
                                     case "Nitrox": return((this.fO2 == 0.8 ? "Stroke Mix" : ("EAN" + (this.fO2 * 100.0).toFixed())));
                                     case "Trimix": return("Tx" + (this.fO2 * 100.0).toFixed() + "/" + (this.fHe * 100.0).toFixed());
                                     case "Heliox": return("Hx" + (this.fO2 * 100.0).toFixed() + "/" + (this.fHe * 100.0).toFixed());
                                     case "Air": return("Tire Inflation Gas");
                                     case "Argon":
                                     case "Oxygen":
                                     case "Helium":
                                     default: return(this.Type);
                                   }};
  this.Density = function(ata) { var densityAir = 1.1839,    // Densities in gm/L at 1ATA, 25 degC
                                     densityHe  = 0.1636,
                                     densityO2  = 1.3079,
                                     densityN2  = 1.1450;
                                 if (this.Type == "Air")
                                   return (densityAir * ata);
                                 else
                                   return (((densityO2 * this.fO2) + (densityHe * this.fHe) + (densityN2 * this.fN2)) * ata);
                               };
  this.MOD = function(ata)   { return (((ata / this.fO2) - 1.0) * 33.0); };
  this.PO2 = function(depth) { return (((depth / 33.0) + 1.0) * this.fO2); };
  this.END = function(depth) { return ((this.fN2 / 0.79) * depth); };
  return;
}

// Constructor for the GasCost object

function GasCost(mixObj, cylObj, dPSI)
{
  this.Mix = mixObj;
  this.Cyl = cylObj;
  this.deltaPSI = dPSI;
  this.TotalVolume = 0.0;

  this.O2Pressure = 0.0;
  this.O2Volume = 0.0;
  this.O2Cost = 0.0;

  this.HePressure = 0.0;
  this.HeVolume = 0.0;
  this.HeCost = 0.0;

  this.ArPressure = 0.0;
  this.ArVolume = 0.0;
  this.ArCost = 0.0;

  this.AirPressure = 0.0;
  this.AirVolume = 0.0;
  this.AirCost = 0.0;

  this.TotalCost = 0.0;
  this.perCubicFoot = 0.0;
  this.cog = 0.0;
  this.cogPerCubicFoot = 0.0;

  this.fogDiscount = 0.0;

  // Fetch the gas prices from the database (and cache them)

  if ((GasMixUseDB() || window.location.href.indexOf("/invoice/") != -1) &&
      typeof($) !== "undefined" && $.propertyIsEnumerable("getJSON") && !GasPricesFetched) {
    $(document).ready(function() {
      var url = window.location.origin + "/OpuaGetGasPrices.php";
      $.ajaxSetup({async: false});
      $.getJSON(url)
       .done(function(data) {
         $.ajaxSetup({async: true});
         if (data) {
           DefaultGasPrices.Oxygen = parseFloat(data.Oxygen);
           DefaultGasPrices.Helium = parseFloat(data.Helium);
           DefaultGasPrices.Argon  = parseFloat(data.Argon);
           DefaultGasPrices.Air    = parseFloat(data.Air);
           DefaultGasPrices.FOGDiscount = parseFloat(data.FOGDiscount);
           DefaultGasPrices.COGOxygen = parseFloat(data.COGOxygen);
           DefaultGasPrices.COGHelium = parseFloat(data.COGHelium);
           DefaultGasPrices.COGArgon  = parseFloat(data.COGArgon);
           DefaultGasPrices.COGAir    = parseFloat(data.COGAir);
           GasPricesFetched++;
//           console.log("Gas Prices Fetched");
         } // if data
       }); // .done
    }); // .ready
  } // GasMixUseDB()

  // Provide defaults for costs and discount if none supplied

  this.costO2  = DefaultGasPrices.Oxygen;
  this.costHe  = DefaultGasPrices.Helium;
  this.costAr  = DefaultGasPrices.Argon;
  this.costAir = DefaultGasPrices.Air;

  // Cost of goods for each gas

  this.cogO2  = DefaultGasPrices.COGOxygen;
  this.cogHe  = DefaultGasPrices.COGHelium;
  this.cogAr  = DefaultGasPrices.COGArgon;
  this.cogAir = DefaultGasPrices.COGAir;

  // Friend?

  this.fogDiscount = 0.0;
  this.fog = false;
  if (GasMixGetFog() && DefaultGasPrices.FOGDiscount > 0.0) {
    this.fog = true;
    this.fogDiscount = DefaultGasPrices.FOGDiscount;
  }

  // Sanity check the discount rate

  if (this.fog) {
    var error = 0;
    var discountO2 = DefaultGasPrices.FOGDiscount * this.costO2;
    if (discountO2 < this.cogO2) {
      alert("Discount O2 cost less than cost of goods: " + discountO2 + " < " + this.cogO2);
      error++;
    }
    var discountHe = DefaultGasPrices.FOGDiscount * this.costHe;
    if (discountHe < this.cogHe) {
      alert("Discount He cost less than cost of goods: " + discountHe + " < " + this.cogHe);
      error++;
    }
    var discountAr = DefaultGasPrices.FOGDiscount * this.costAr;
    if (discountAr < this.cogAr) {
      alert("Discount Ar cost less than cost of goods: " + discountAr + " < " + this.cogAr);
      error++;
    }
    var discountAir = DefaultGasPrices.FOGDiscount * this.costAir;
    if (discountAir < this.cogAir) {
      alert("Discount Air cost less than cost of goods: " + discountAir + " < " + this.cogAir);
      error++;
    }
    if (error) {
      this.fog = false;
      this.fogDiscount = 0.0;
    } else {
      this.costO2  *= this.fogDiscount;
      this.costHe  *= this.fogDiscount;
      this.costAr  *= this.fogDiscount;
      this.costAir *= this.fogDiscount;
    }
  }

  // If no mix, just return the O2, He, Ar and Air prices

  if (!mixObj)
    return;

  // Hack alert.  If supplied with a null cylinder object then just return the
  // gas prices, including the price per cubic foot.  To do this we must create
  // a dummy cylinder object and then run thru the mixing calculations below.

  if (!cylObj) {
    cylObj = new DiveCylinder("Dummy", "Dummy", 1.0, 100.0, 28.32, 6.8, false, false, false, false, false);
    dPSI = cylObj.Pressure;
  }

  // Pure/non-mixed gas cases first

  if (mixObj.fO2 == 1.0) {

    // Oxygen

    this.O2Pressure = dPSI;
    this.perCubicFoot = this.costO2;
    this.O2Volume = cylObj.computeGasUse(dPSI);
    this.TotalVolume = this.O2Volume;
    this.TotalCost = this.costO2 * this.O2Volume;
    this.O2Cost = this.TotalCost;
    this.cog = this.cogO2 * this.O2Volume;
    this.cogPerCubicFoot = this.cog / this.TotalVolume;

  } else if (mixObj.fHe == 1.0)  {

    // Helium

    this.HePressure = dPSI;
    this.perCubicFoot = this.costHe;
    this.HeVolume = cylObj.computeGasUse(dPSI);
    this.TotalVolume = this.HeVolume;
    this.TotalCost = this.costHe * this.HeVolume;
    this.HeCost = this.TotalCost;
    this.cog = this.cogHe * this.HeVolume;
    this.cogPerCubicFoot = this.cog / this.TotalVolume;

  } else if (mixObj.fAr == 1.0) {

    // Argon

    this.ArPressure = dPSI;
    this.perCubicFoot = this.costAr;
    this.ArVolume = cylObj.computeGasUse(dPSI);
    this.TotalVolume = this.ArVolume;
    this.TotalCost = this.costAr * this.ArVolume;
    this.ArCost = this.TotalCost;
    this.cog = this.cogAr * this.ArVolume;
    this.cogPerCubicFoot = this.cog / this.TotalVolume;

  } else if (mixObj.fO2 == 0.21 && mixObj.fHe === 0.0) {

    // Air

    this.AirPressure = dPSI;
    this.perCubicFoot = this.costAir;
    this.AirVolume = cylObj.computeGasUse(dPSI);
    this.TotalVolume = this.AirVolume;
    this.TotalCost = this.costAir * this.AirVolume;
    this.AirCost = this.TotalCost;
    this.cog = this.cogAir * this.AirVolume;
    this.cogPerCubicFoot = this.cog / this.TotalVolume;

  } else {

    // Mixed gas

    this.HePressure = dPSI * mixObj.fHe ;
    this.O2Pressure = (((mixObj.topMix - 0.21) / 0.79) * (dPSI - this.HePressure));
    this.AirPressure = dPSI - this.HePressure - this.O2Pressure;

    // Volumes [in this cylinder]

    this.O2Volume = cylObj.computeGasUse(this.O2Pressure);
    this.HeVolume = cylObj.computeGasUse(this.HePressure);
    this.AirVolume = cylObj.computeGasUse(this.AirPressure);
    this.TotalVolume = this.O2Volume + this.HeVolume + this.AirVolume;

    // Costs

    this.O2Cost = this.O2Volume * this.costO2;
    this.HeCost = this.HeVolume * this.costHe;
    this.AirCost = this.AirVolume * this.costAir;
    this.TotalCost = this.O2Cost + this.HeCost + this.AirCost;
    this.perCubicFoot = this.TotalCost / this.TotalVolume;
    this.cog = (this.cogO2 * this.O2Volume) + (this.cogHe * this.HeVolume) + (this.cogAir * this.AirVolume);
    this.cogPerCubicFoot = this.cog / this.TotalVolume;
  }

  // Hack alert - if supplied with a null cylinder object, we've been asked for the gas
  // costs, including the per cubic foot value.  To compute that we've created a dummy
  // cylinder object, which we must now forget.  The garbage collector will take care
  // of deallocating the dummy cylinder object for us.

  return;
}

// Parse a gas mix name
//
// Returns a GasMix object
//
// Examples:
//
//   EAN32
//   32
//   21
//   Trimix 21/35
//   Heliox 7/93
//   Oxygen
//   Helium
//   Air
//   Argon
//
// Transformations:
//
//   21/0 -> Air
//   EAN100 -> Oxygen
//   9/91 -> Heliox 9/91

function ParseMix(mix)
{
  if (!mix)
    return(null);

  // Regular expressions to match various mixture notations
  // Evaluation order is important!  Trimix must preceed Nitrox...

  var nitroxRE = /[ean|nitrox]?\s?(\d{2,3})/i;
  var trimixRE = /[tx|trmix|hx|heliox]?\s?(\d{1,2})\/(\d{1,2})/i;
  var oxygenRE = /oxygen|o2/i;
  var heliumRE = /helium|he/i;
  var airRE    = /air/i;
  var argonRE  = /argon|ar/i;

  // Match TxOO/HH / Trimix OO/HH / OO/HH

  if (trimixRE.test(mix)) {
    var gasses = mix.split(trimixRE);
    var fO2 = parseFloat(gasses[1]);
    var fHe = parseFloat(gasses[2]);

    // Sanity checks

    if (isNaN(fHe) || isNaN(fO2) || (fO2 + fHe) > 100.0 || (fHe === 0 && fO2 < 21.0))
      return(null);

    // No helium -> nitrox

    if (fHe === 0.0)
      return new GasMix((fO2 == 21.0 ? "Air" : "Nitrox"), (fO2 / 100.0), 0.0);

    // Trimix or Heliox

    return new GasMix(((fO2 + fHe) == 100.0 ? "Heliox" : "Trimix"), (fO2 / 100.0), (fHe / 100.0));
  }

  // Match EANx / Nitrox x / naked fO2

  else if (nitroxRE.test(mix)) {
    var gasses = mix.split(nitroxRE);
    var fO2 = parseFloat(gasses[1]);

    // Sanity checks  fO2 > 0.21 && <= 100.0

    if (isNaN(fO2) || fO2 < 21.0 || fO2 > 100.0)
      return(null);

    // EAN100 -> Oxygen

    if (fO2 == 100.0)
      return new GasMix("Oxygen", 1.0, 0.0);

    // EAN21 -> Air

    if (fO2 == 21.0)
      return new GasMix("Air", 0.21, 0.0);

    // Nitrox

    return new GasMix("Nitrox", (fO2 / 100.0), 0.0);
  }

  // Match Oxygen

  else if (oxygenRE.test(mix))
    return new GasMix("Oxygen", 1.0, 0.0);

  // Match Helium

  else if (heliumRE.test(mix))
    return new GasMix("Helium", 0.0, 1.0);

  // Match Air

  else if (airRE.test(mix))
    return new GasMix("Air", 0.21, 0.0);

  // Match Argon

  else if (argonRE.test(mix))
    return new GasMix("Argon", 0.0, 0.0);
  else
    return(null);
}

// Get "Friend Of Gerard"

function GasMixGetFog()
{

  // Check to see if we're editing an invoice

  var invoiceFOGelement = document.getElementById("FOG");
  if (invoiceFOGelement && invoiceFOGelement.type == "checkbox")
    return (invoiceFOGelement.checked);

  // Consult the URL otherwise

  var urlvars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    urlvars[key] = value;
  });
  return (urlvars.propertyIsEnumerable('FOG'));
}

// Get UseDB

function GasMixUseDB()
{
  var urlvars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
    urlvars[key] = value;
  });
  return (urlvars.propertyIsEnumerable('UseDB'));
}

// Emit a PayPal Pay Now button

function emitPayPalButton(whatFor, cost, div)
{
  div.innerHTML = "";
  var bd = new Array();
  bd['item_name'] = { value: whatFor };
  bd['amount'] = { value: cost };
  return (PAYPAL.apps.ButtonFactory.create("gkn@opua.org", bd, "buynow", div));
}
//</script>
