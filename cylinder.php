<?php
  // Cylinder parameters array:
  //
  //    Key
  //    Description
  //    Short name
  //    Volume
  //    Pressure
  //    Volume (liters)
  //    Pressure (bar)
  //    Uses - Backgas, Stage, Doubles, Rebreather, Suit, Medical

class Cylinder {
  public $Description, $ShortName, $Volume, $Pressure, $Liters, $spBar, $BackGas, $Stage, $Doubles, $Rebreather, $Suit, $Medical;

  public function computeGasUse($deltaPSI) {
    return ((double)$deltaPSI / $this->Pressure) * $this->Volume;
  }

  public function computeGasUseMetric($deltaBar) {
    return ((double)$deltaBar / $this->spBar) * $this->Liters;
  }

  public function cuFtToPSI($cuFt) {
    return ($cuFt * ($this->Pressure / $this->Volume));
  }

  public function lToBar($l) {
    return ($l * ($this->spBar / $this->Liters));
  }

  public function __construct($descr, $sh, $vol, $press, $ltrs, $spB, $bg=false, $s=false, $d=false, $r=false, $su=false, $md=false) {
    $this->Description = $descr;
    $this->ShortName = $sh;
    $this->Volume = (double) $vol;
    $this->Pressure = (double) $press;
    $this->Liters = (double) $ltrs;
    $this->spBar = (double) $spB;
    $this->tankFactor = (double) (($this->Volume / $this->Pressure) * 100.0);
    $this->waterCapacity = (double) ($this->Liters / $this->spBar);
    $this->BackGas = $bg;
    $this->Stage = $s;
    $this->Doubles = $d;
    $this->Rebreather = $r;
    $this->Suit = $su;
    $this->Medical = $md;
  }
}

const BackGas = true;
const Stage = true;
const Doubles = true;
const Rebreather = true;
const Suit = true;
const Medical = true;

// Backgas singles and big stages

$Cylinders['al80']   = new Cylinder("Catalina/Luxfer Aluminum 80", "Al 80", 77.4, 3000, 2192.0, 207, BackGas, Stage, !Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['al63']   = new Cylinder("Catalina/Luxfer Aluminum 63", "Al 63", 63.0, 3000, 1784.2, 207, BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['al72']   = new Cylinder("Luxfer Aluminum 72", "Al 72", 69.6, 3000, 1971.1, 207, BackGas, Stage, !Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['x7100']  = new Cylinder("XS/Worthington X7-100", "X7-100", 99.5, 3442, 2817.5, 238,  BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['l100']   = new Cylinder("Luxfer Aluminum 100", "Al 100", 99.3, 3300, 2798.0, 228, BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['c100']   = new Cylinder("Catalina Aluminum 100", "Al 100", 100.0, 3300, 2732.0, 228, BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['c80']    = new Cylinder("Coyne LP 80", "LP 80", 71.0, 2400, 2010.7, 166, BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['p100']   = new Cylinder("PST HP 100", "PST 100", 102.0, 3500, 2888.32, 242, BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['fx100']  = new Cylinder("Faber FX-100", "FX 100", 100.0, 3442, 2831.6, 238, BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['s98']    = new Cylinder("OMS Single LP 98", "LP 98", 98.0, 2640, 2775.0, 182, BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['s112']   = new Cylinder("OMS Single LP 112", "LP 112", 112.0, 2640, 3171.5, 182, BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['x7120']  = new Cylinder("XS/Worthington X7-120", "X7-120", 120.6, 3442, 3412.2, 238, BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['x8119']  = new Cylinder("XS/Worthington X8-119", "X8-119", 123.0, 3442, 3483.0, 238, BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['x8130']  = new Cylinder("XS/Worthington X8-130", "X9-130", 131.4, 3442, 3720.8, 238, BackGas, !Stage, !Doubles, !Rebreather, !Suit, !Medical);

// Small stages

$Cylinders['al40']   = new Cylinder("Luxfer Aluminum 40", "Al 40", 40.0, 3000, 1132.8, 207, !BackGas, Stage, !Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['al30']   = new Cylinder("Catalina Aluminum 30", "Al 30", 30.0, 3000, 849.6, 207, !BackGas, Stage, !Doubles, Rebreather, !Suit, !Medical);
$Cylinders['al27']   = new Cylinder("Luxfer Aluminum 27", "Al 27", 27.9, 3000, 781.6, 207, !BackGas, Stage, !Doubles, Rebreather, !Suit, !Medical);

// Doubles

$Cylinders['d80']    = new Cylinder("Double Luxfer/Catalina Aluminum 80s", "Dbl 80s", 154.8, 3000, 4384.0, 207, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['d85']    = new Cylinder("Double OMS LP 85s", "Dbl 85s", 170.0, 2640, 4813.9, 182, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['d100']   = new Cylinder("Double Luxfer Aluminum 100s", "Dbl 100s", 198.6, 3300, 5596.0, 228, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['dx7100'] = new Cylinder("Double XS/Worthington X7-100s", "Dbl X7-100s", 199.0, 3442, 5635.0, 238, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['dx7120'] = new Cylinder("Double XS/Worthington X7-120s", "Dbl X7-120s", 241.2, 3442, 6830.0, 238, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['dx8119'] = new Cylinder("Double XS/Worthington X8-119s", "Dbl X8-119s", 246.0, 3442, 6965.9, 238, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['dx8130'] = new Cylinder("Double XS/Worthington X8-130s", "Dbl X8-130s", 262.8, 3442, 7441.7, 238, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['dst40']  = new Cylinder("Double XS/Worthington Steel 40s", "Dbl St 40", 72.8, 3130, 2061.5, 216, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['d45']    = new Cylinder("Double OMS LP 45s", "Dbl 45s", 90.0, 2400, 2548.5, 164, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['d98']    = new Cylinder("Double OMS LP 98s", "Dbl 98s", 196.0, 2640, 5550.1, 182, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['d112']   = new Cylinder("Double OMS LP 112s", "Dbl 112s", 224.0, 2640, 6343.0, 182, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);
$Cylinders['d104']   = new Cylinder("Double PST LP 104s", "Dbl 104s", 212.4, 2640, 6014.5, 182, BackGas, !Stage, Doubles, !Rebreather, !Suit, !Medical);

// Rebreather

$Cylinders['l19']    = new Cylinder("Luxfer Aluminum 19", "Al 19", 19.9, 3000, 563.6, 207, !BackGas, Stage, !Doubles, Rebreather, !Suit, !Medical);
$Cylinders['c19']    = new Cylinder("Catalina Aluminum 19", "Al 19", 19.0, 3000, 558.9, 207, !BackGas, Stage, !Doubles, Rebreather, !Suit, !Medical);
$Cylinders['x19']    = new Cylinder("XS Aluminum 19", "Al 19", 19.0, 3130, 558.9, 215.8, !BackGas, Stage, !Doubles, Rebreather, !Suit, !Medical);
$Cylinders['st15']   = new Cylinder("Faber Steel 15", "St 15", 15.0, 3442.0, 424.8, 237.0, !BackGas, !Stage, !Doubles, Rebreather, !Suit, !Medical);
$Cylinders['st23']   = new Cylinder("Faber Steel 23", "St 23", 23.0, 3442, 651.3, 237, !BackGas, !Stage, !Doubles, Rebreather, !Suit, !Medical);
$Cylinders['lp27']   = new Cylinder("Faber Steel 27", "LP St 27", 27.0, 2640, 764.6, 182, !BackGas, !Stage, !Doubles, Rebreather, !Suit, !Medical);
$Cylinders['st27']   = new Cylinder("Dr&auml;ger Steel 27", "St 27", 28.3, 3000, 828.0, 207, !BackGas, !Stage, !Doubles, Rebreather, !Suit, !Medical);
$Cylinders['st40']   = new Cylinder("XS/Worthington Steel 40", "St 40", 39.2, 3442.0, 1110.0, 238.0, !BackGas, !Stage, !Doubles, Rebreather, !Suit, !Medical);
$Cylinders['al13']   = new Cylinder("Catalina/Luxfer Aluminum 13", "Al 13", 13.2, 3000, 373.8, 207, !BackGas, !Stage, !Doubles, Rebreather, Suit, !Medical);

// Suit inflation

$Cylinders['al6']    = new Cylinder("Catalina/Luxfer Aluminum 6", "Al 6", 6.0, 3000, 169.9, 207, !BackGas, !Stage, !Doubles, !Rebreather, Suit, !Medical);

// Medical

$Cylinders['jd']     = new Cylinder("Jumbo D", "JD", 23.0, 2216, 651.3, 151, !BackGas, !Stage, !Doubles, !Rebreather, !Suit, Medical);
$Cylinders['m9']     = new Cylinder("M9", "M9", 9.0, 2216, 255.0, 151, !BackGas, !Stage, !Doubles, !Rebreather, !Suit, Medical);
$Cylinders['m6']     = new Cylinder("M6", "M6", 5.8, 2216, 164.0, 151, !BackGas, !Stage, !Doubles, !Rebreather, !Suit, Medical);
$Cylinders['m22']    = new Cylinder("ME", "ME", 24.0, 2015, 679.6, 139, !BackGas, !Stage, !Doubles, !Rebreather, !Suit, Medical);
?>
