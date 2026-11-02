import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

class RacaService {
  RacaService._();

  static const _host = 'dog.ceo';
  static const _timeout = Duration(seconds: 8);

  static Map<String, String>? _cache;

  static Future<dynamic> _get(String caminho) async {
    try {
      final resposta =
          await http.get(Uri.https(_host, caminho)).timeout(_timeout);
      if (resposta.statusCode != 200) return null;
      final corpo = jsonDecode(utf8.decode(resposta.bodyBytes));
      if (corpo is Map && corpo['status'] == 'success') return corpo['message'];
      return null;
    } on TimeoutException {
      return null;
    } on SocketException {
      return null;
    } catch (_) {
      return null;
    }
  }

  static String _capitalizar(String s) =>
      s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);

  static Future<Map<String, String>> _carregar() async {
    if (_cache != null) return _cache!;

    final mensagem = await _get('/api/breeds/list/all');
    if (mensagem is! Map) return {};

    final mapa = <String, String>{};
    mensagem.forEach((raca, subs) {
      final base = raca as String;
      final lista = (subs as List?) ?? const [];
      if (lista.isEmpty) {
        mapa[_capitalizar(base)] = base;
      } else {
        for (final sub in lista) {
          mapa['${_capitalizar(sub as String)} ${_capitalizar(base)}'] =
              '$base/$sub';
        }
      }
    });

    _cache = mapa;
    return mapa;
  }

  static Future<List<String>> listar() async {
    final nomes = (await _carregar()).keys.toList()..sort();
    return nomes;
  }

  static Future<String?> imagem(String raca) async {
    final alvo = raca.trim().toLowerCase();
    if (alvo.isEmpty) return null;

    final mapa = await _carregar();
    String? caminho;
    mapa.forEach((nome, c) {
      if (nome.toLowerCase() == alvo) caminho = c;
    });
    if (caminho == null) return null;

    final url = await _get('/api/breed/$caminho/images/random');
    return url is String ? url : null;
  }
}
