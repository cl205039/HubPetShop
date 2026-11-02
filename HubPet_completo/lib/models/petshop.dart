import 'dart:math' as math;

import 'json_utils.dart';

class Petshop {
  final int id;
  final String nome;
  final double nota;
  final double distanciaKm;
  final double? lat;
  final double? lng;

  const Petshop({
    required this.id,
    required this.nome,
    required this.nota,
    required this.distanciaKm,
    this.lat,
    this.lng,
  });

  factory Petshop.fromJson(Map<String, dynamic> json) => Petshop(
        id: paraInt(json['id'] ?? json['petshopId'] ?? json['petshop_id']) ?? 0,
        nome: json['nome'] as String? ?? '',
        nota: paraDouble(json['nota']),
        distanciaKm: paraDouble(json['distanciaKm']),
        lat: json['lat'] == null ? null : paraDouble(json['lat']),
        lng: json['lng'] == null ? null : paraDouble(json['lng']),
      );

  bool get temCoordenadas => lat != null && lng != null;

  String get notaFormatada => nota.toStringAsFixed(1);

  String get distanciaFormatada => _formatarKm(distanciaKm);

  static String _formatarKm(double km) =>
      km < 1 ? '${(km * 1000).round()} m' : '${km.toStringAsFixed(1)} km';

  double? distanciaRealKm(double latUsuario, double lngUsuario) {
    if (!temCoordenadas) return null;
    return _haversineKm(latUsuario, lngUsuario, lat!, lng!);
  }

  String? distanciaRealFormatada(double latUsuario, double lngUsuario) {
    final km = distanciaRealKm(latUsuario, lngUsuario);
    return km == null ? null : _formatarKm(km);
  }
}

double _haversineKm(double lat1, double lng1, double lat2, double lng2) {
  const raioTerraKm = 6371.0;
  final dLat = _paraRad(lat2 - lat1);
  final dLng = _paraRad(lng2 - lng1);
  final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
      math.cos(_paraRad(lat1)) *
          math.cos(_paraRad(lat2)) *
          math.sin(dLng / 2) *
          math.sin(dLng / 2);
  final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
  return raioTerraKm * c;
}

double _paraRad(double graus) => graus * math.pi / 180;
