// Helpers de conversão usados pelos `fromJson` dos modelos.
// A API pode devolver números como int/double ou como string —
// essas funções aceitam qualquer um dos formatos sem quebrar o app.

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
