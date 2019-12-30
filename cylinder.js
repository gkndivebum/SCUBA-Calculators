//<script language="javascript>
// Cylinder parameters array:
//
//     Key
//     Description
//     Short name
//     Volume
//     Pressure
//     Volume (liters)
//     Pressure (bar)
//     Use - Backgas, stage, doubles, CCR, suit, Medical

function DiveCylinder(Description, ShortName, Volume, Pressure, Liters, spBar, bg, st, d, r, s, m)
{
  this.Description = Description;
  this.ShortName = ShortName;
  this.Volume = Volume;
  this.Pressure = Pressure;
  this.Liters = Liters;
  this.spBar = spBar;
  this.tankFactor = (this.Volume / this.Pressure) * 100.0;
  this.waterCapacity = (this.Liters / this.spBar);
  this.BackGas = bg;
  this.Stage = st;
  this.Doubles = d;
  this.Rebreather = r;
  this.Suit = s;
  this.Medical = m;

  this.computeGasUse = function(deltaPSI) { return ((deltaPSI / this.Pressure) * this.Volume); };
  this.computeGasUseMetric = function(deltaBar) { return ((deltaBar / this.spBar) * this.Liters); };
  this.cuFtToPSI = function(cuFt) { return (cuFt * (this.Pressure / this.Volume)); };
  this.lToBar = function(l) { return (l * (this.spBar / this.Liters)); };
}

var BackGas = true;
var Stage = true;
var Doubles = true;
var Rebreather = true;
var Suit = true;
var Medical = true;

var Cylinders = new Array();

// Backgas singles & big stages

Cylinders['al80']   = new DiveCylinder("Catalina/Luxfer Aluminum 80", "Al 80", 77.4, 3000.0, 2192.0, 207.0, BackGas, Stage, !Doubles, !Rebreather, !Suit, !Medical);
Cylinders['al63']   = new DiveCylinder("Catalina/Luxfer Aluminum 63", "Al 63", 63.0, 3000.0, 1784.2, 207.0, BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);
Cylinders['al72']   = new DiveCylinder("Luxfer Aluminum 72", "Al 72", 69.6, 3000.0, 1971.1, 207.0, BackGas, Stage, !Doubles, !Rebreather, !Suit, !Medical);
Cylinders['x7100']  = new DiveCylinder("XS/Worthington X7-100", "X7-100", 99.5, 3442.0, 2817.5, 238.0, BackGas, Stage, !Doubles, !Rebreather, !Suit, !Medical);
Cylinders['l100']   = new DiveCylinder("Luxfer Aluminum 100", "Al 100", 99.3, 3300.0, 2798.0, 228.0, BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);
Cylinders['c100']   = new DiveCylinder("Catalina Aluminum 100", "Al 100", 100.0, 3300.0, 2732.0, 228.0, BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);
Cylinders['c80']    = new DiveCylinder("Coyne LP 80", "LP 80", 71.0, 2400, 2010.7, 166.0, BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);
Cylinders['p100']   = new DiveCylinder("PST HP 100", "PST 100", 102.0, 3500, 2888.3, 242.0, BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);
Cylinders['fx100']  = new DiveCylinder("Faber FX-100", "FX 100", 100.0, 3442, 2831.6, 238.0, BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);
Cylinders['s98']    = new DiveCylinder("OMS Single LP 98", "LP 98", 98.0, 2640.0, 2775.0, 182.0, BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);
Cylinders['s112']   = new DiveCylinder("OMS Single LP 112", "LP 112", 112.0, 2640.0, 3171.5, 182.0, BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);
Cylinders['x7120']  = new DiveCylinder("XS/Worthington X7-120", "X7-120", 120.6, 3442.0, 3412.2, 238.0, BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);
Cylinders['x8119']  = new DiveCylinder("XS/Worthington X8-119", "X8-119", 123.0, 3442.0, 3483.0, 238.0, BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);
Cylinders['x8130']  = new DiveCylinder("XS/Worthington X8-130", "X8-130", 131.4, 3442.0, 3720.8, 238.0, BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);

// Small stages

Cylinders['al40']   = new DiveCylinder("Luxfer Aluminum 40", "Al 40", 40.0, 3000.0, 1132.8, 207.0, !BackGas, Stage, !Doubles, !Rebreather, !Suit, !Medical);
Cylinders['al30']   = new DiveCylinder("Catalina Aluminum 30", "Al 30", 30.0, 3000.0, 849.6, 207.0, !BackGas, Stage, !Doubles, Rebreather, !Suit, !Medical);
Cylinders['al27']   = new DiveCylinder("Luxfer Aluminum 27", "Al 27", 27.9, 3000.0, 781.6, 207.0,  !BackGas, Stage, !Doubles, Rebreather, !Suit, !Medical);

// Doubles

Cylinders['d80']    = new DiveCylinder("Double Luxfer/Catalina Aluminum 80s", "Dbl 80s", 154.8, 3000.0, 4384.0, 207.0, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);
Cylinders['d85']    = new DiveCylinder("Double OMS LP 85s", "Dbl 85s", 170.0, 2640.0, 4813.9, 182.0, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);
Cylinders['d100']   = new DiveCylinder("Double Luxfer Aluminum 100s", "Dbl 100s", 198.6, 3300.0, 5596.0, 228.0, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);
Cylinders['dx7100'] = new DiveCylinder("Double XS/Worthington X7-100s", "Dbl X7-100s", 199.0, 3442.0, 5635.0, 238.0, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);
Cylinders['dx7120'] = new DiveCylinder("Double XS/Worthington X7-120s", "Dbl X7-120s", 241.2, 3442.0, 6830.0, 228.0, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);
Cylinders['dx8119'] = new DiveCylinder("Double XS/Worthington X8-119s", "Dbl X8-119s", 246.0, 3442.0, 6965.9, 228.0, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);
Cylinders['dx8130'] = new DiveCylinder("Double XS/Worthington X8-130s", "Dbl X8-130s", 262.8, 3442.0, 7441.7, 228.0, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);
Cylinders['dst40']  = new DiveCylinder("Double XS/Worthington Steel 40s", "Dbl St 40", 72.8, 3130.0, 2061.5, 216.0, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);
Cylinders['d45']    = new DiveCylinder("Double OMS LP 45s", "Dbl 45s", 90.0, 2400.0, 2548.5, 164.0, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);
Cylinders['d98']    = new DiveCylinder("Double OMS LP 98s", "Dbl 98s", 196.0, 2640.0, 5550.1, 182.0, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);
Cylinders['d112']   = new DiveCylinder("Double OMS LP 112s", "Dbl 112s", 224.0, 2640.0, 6343.0, 182.0, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);
Cylinders['d104']   = new DiveCylinder("Double PST LP 104s", "Dbl 104s", 212.4, 2640.0, 6014.5, 182.0, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);

// Rebreather

Cylinders['l19']    = new DiveCylinder("Luxfer Aluminum 19", "Al 19", 19.9, 3000.0, 563.6, 207.0, !BackGas, Stage, !Doubles, Rebreather, !Suit, !Medical);
Cylinders['c19']    = new DiveCylinder("Catalina Aluminum 19", "Al 19", 19.0, 3000.0, 558.9, 207.0,  !BackGas, Stage, !Doubles, Rebreather, !Suit, !Medical);
Cylinders['x19']    = new DiveCylinder("XS Aluminum 19", "Al 19", 19.0, 3130.0, 558.9, 215.8, !BackGas, Stage, !Doubles, Rebreather, !Suit, !Medical);
Cylinders['st15']   = new DiveCylinder("Faber Steel 15", "St 15", 15.0, 3442.0, 424.8, 237.0, !BackGas, !Stage, !Doubles, Rebreather, !Suit, !Medical);
Cylinders['st23']   = new DiveCylinder("Faber Steel 23", "St 23", 23.0, 3442.0, 651.3, 237.0, !BackGas, !Stage, !Doubles, Rebreather, !Suit, !Medical);
Cylinders['lp27']   = new DiveCylinder("Faber Steel 27", "LP St 27", 27.0, 2640, 764.6, 182, !BackGas, !Stage, !Doubles, Rebreather, !Suit, !Medical);
Cylinders['st27']   = new DiveCylinder("Drager Steel 27", "St 27", 28.3, 3000.0, 828.0, 207.0, !BackGas, !Stage, !Doubles, Rebreather, !Suit, !Medical);
Cylinders['st40']   = new DiveCylinder("XS/Worthington Steel 40", "St 40", 39.2, 3442.0, 1110.0, 238.0, !BackGas, !Stage, !Doubles, Rebreather, !Suit, !Medical);
Cylinders['al13']   = new DiveCylinder("Catalina/Luxfer Aluminum 13", "Al 13", 13.2, 3000.0, 373.8, 207.0, !BackGas, !Stage, !Doubles, Rebreather, Suit, !Medical);

// Suit inflation

Cylinders['al6']    = new DiveCylinder("Catalina/Luxfer Aluminum 6", "Al 6", 6.0, 3000.0, 169.9, 207.0, !BackGas, !Stage, !Doubles, !Rebreather, Suit, !Medical);

// Medical

Cylinders['jd']     = new DiveCylinder("Jumbo D", "JD", 23.0, 2216.0, 651.3, 151.0, !BackGas, !Stage, !Doubles, !Rebreather, !Suit, Medical);
Cylinders['m9']     = new DiveCylinder("M9", "M9", 9.0, 2216.0, 255.0, 151.0, !BackGas, !Stage, !Doubles, !Rebreather, !Suit, Medical);
Cylinders['m6']     = new DiveCylinder("M6", "M6", 5.8, 2216.0, 164.0, 151.0, !BackGas, !Stage, !Doubles, !Rebreather, !Suit, Medical);
Cylinders['me']     = new DiveCylinder("ME", "ME", 24.0, 2015, 679.6, 139, !BackGas, !Stage, !Doubles, !Rebreather, !Suit, Medical);
//</script>
