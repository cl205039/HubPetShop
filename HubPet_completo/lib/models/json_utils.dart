
int? paraInt(dynamic valor) {
  if (valor == null) return null;
  if (valor is int) return valor;
  if (valor is double) return valor.toInt();
  return int.tryParse(valor.toString());
}

double paraDouble(dynamic valor, {double padrao = 0}) {
  if (valor == null) return padrao;
  if (valor is double) return valor;
  if (valor is int) return valor.toDouble();
  return double.tryParse(valor.toString().replaceAll(',', '.')) ?? padrao;
}
