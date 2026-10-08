import '../api_client.dart';
import '../models/petshop.dart';

class PetshopService {
  PetshopService._();

  static Future<List<Petshop>> listar() async {
    final json = await ApiClient.get('petshops');
    return (json as List)
        .map((e) => Petshop.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<Petshop> buscarPorId(int id) async {
    final json = await ApiClient.get('petshops/$id');
    return Petshop.fromJson(json as Map<String, dynamic>);
  }
}
