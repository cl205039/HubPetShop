import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

class Coordenadas {
  final double lat;
  final double lng;
  const Coordenadas(this.lat, this.lng);
}

class GeocodingService {
  GeocodingService._();

  static const _userAgent = 'HubPetShop/1.0 (projeto academico)';

  static Future<Coordenadas?> buscar(String enderecoTexto) async {
    final uri = Uri.https('nominatim.openstreetmap.org', '/search', {
      'q': enderecoTexto,
      'format': 'json',
      'limit': '1',
    });

    try {
      final resposta = await http
          .get(uri, headers: {'User-Agent': _userAgent})
          .timeout(const Duration(seconds: 8));

      if (resposta.statusCode != 200) return null;

      final lista = jsonDecode(utf8.decode(resposta.bodyBytes)) as List;
      if (lista.isEmpty) return null;

      final item = lista.first as Map<String, dynamic>;
      final lat = double.tryParse(item['lat'] as String? ?? '');
      final lng = double.tryParse(item['lon'] as String? ?? '');
      if (lat == null || lng == null) return null;

      return Coordenadas(lat, lng);
    } on TimeoutException {
      return null;
    } on SocketException {
      return null;
    } catch (_) {
      return null;
    }
  }
}
