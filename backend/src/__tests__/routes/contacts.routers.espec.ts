import request from "supertest";
import { DataSource } from "typeorm";
import app from "../../app";
import { AppDataSource } from "../../data-source";
import { CreateUserService } from "../../services/clients/CreateUser.service";
import { ListAllUsersService } from "../../services/clients/ListAllUsers.service";
import { ContactCreateService } from "../../services/contacts/CreateContact.service";

describe("Teste de criação Contatos", () => {
    let connection: DataSource

    beforeAll(async () => {
        await AppDataSource.initialize().then((res) => {
            connection = res
        }).catch((err) => {
            console.error("Erro durante a inicialização do banco de dados", err)
        });
    })

    afterAll(async () => {
        await connection.destroy();
    })

    const contact1Data = {
        "type": "Pessoal",
        "email": "pessoal@mail.com",
        "phone": "21999908501"
    }

    const contact2Data = {
        "type": "Trabalho",
        "email": "trabalho@mail.com",
        "phone": "21999908551"
    }

    const invalidId = "a9aa99a9-999a-99a9-999a-9aa999aaaaaa"


    test("Testar a criação de dois contacts para um usuário", async () => {
        await CreateUserService({ name: "Client teste 1" });
        const ListAllClients = await ListAllUsersService();
        const newClientId = ListAllClients[0].id;
        await request(app).post(`/user/${newClientId}/contact`).send(contact1Data);
        const response = await request(app).post(`/user/${newClientId}/contact`).send(contact2Data);
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("client")
        expect(response.body.client).toHaveProperty("id")
        expect(response.body.client).toHaveProperty("name")
        expect(response.body.client).toHaveProperty("date")
        expect(response.body).toHaveProperty("type")
        expect(response.body).toHaveProperty("email")
        expect(response.body).toHaveProperty("phone")
    })

    test("Testar a criação de um novo contact sem telefone e email", async () => {
        await CreateUserService({ name: "Client teste 2" });
        const ListAllClients = await ListAllUsersService();
        const newClientId = ListAllClients[0].id;
        const response = await request(app).post(`/user/${newClientId}/contact`).send({"type": "Inválido", "email": "", "phone": ""});
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("message")
        expect(response.body.message).toBe("Insira pelo menos um telefone ou email")
    })

    test("Testar a criação de dois emails iguais para um usuário", async () => {
        await CreateUserService({ name: "Client teste 3" });
        const ListAllClients = await ListAllUsersService();
        const newClientId = ListAllClients[0].id;
        await request(app).post(`/user/${newClientId}/contact`).send(contact1Data);
        const response = await request(app).post(`/user/${newClientId}/contact`).send(contact1Data.email);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message")
        expect(response.body.message).toBe("O email do usuário já foi cadastrado")
    })


    test("Testar a criação de dois telefones iguais para um usuário", async () => {
        await CreateUserService({ name: "Client teste 4" });
        const ListAllClients = await ListAllUsersService();
        const newClientId = ListAllClients[0].id;
        await request(app).post(`/user/${newClientId}/contact`).send(contact1Data);
        const response = await request(app).post(`/user/${newClientId}/contact`).send(contact1Data.phone);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message")
        expect(response.body.message).toBe("O email do usuário já foi cadastrado")
    })


    test("Testar criar contatos para cliente com id inválido", async () => {
        const response = await request(app).post(`/user/${invalidId}/contact`).send(contact1Data);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message")
        expect(response.body.message).toBe("Usuário não encontrado")
    })
});


describe("Teste de listagem de contatos", () => {
    let connection: DataSource

    beforeAll(async () => {
        await AppDataSource.initialize().then((res) => {
            connection = res
        }).catch((err) => {
            console.error("Erro durante a inicialização do banco de dados", err)
        });
    })

    afterAll(async () => {
        await connection.destroy();
    })

    const contact1Data = {"type": "Pessoal", "email": "pessoal@mail.com", "phone": "21999908501"}
    const contact2Data = {"type": "Trabalho", "email": "trabalho@mail.com", "phone": "21999908551"}
    const contact3Data = {"type": "Recados", "email": "recados@mail.com", "phone": "21999999999"}

    test("Test listar contatos de um cliente", async () => {
        await CreateUserService({ name: "Client teste 5" });
        const ListAllClients = await ListAllUsersService();
        const newClientId = ListAllClients[0].id;
        await ContactCreateService(newClientId, contact1Data.type, contact1Data.email, contact1Data.phone);
        await ContactCreateService(newClientId, contact2Data.type, contact2Data.email, contact2Data.phone);
        await ContactCreateService(newClientId, contact3Data.type, contact3Data.email, contact3Data.phone);
        const response = await request(app).get("/users");
        expect(response.body).toHaveProperty("name")
        expect(response.body).toHaveProperty("contacts")
        expect(response.body.contacts).toHaveProperty("map")
        expect(response.body.contacts.length).toBe(3)
    })

    test("Test integridade da lista de contatos", async () => {
        await CreateUserService({ name: "Client teste 6" });
        const ListAllClients = await ListAllUsersService();
        const newClientId = ListAllClients[1].id;
        await ContactCreateService(newClientId, contact1Data.type, contact1Data.email, contact1Data.phone);
        await ContactCreateService(newClientId, contact2Data.type, contact2Data.email, contact2Data.phone);
        await ContactCreateService(newClientId, contact3Data.type, contact3Data.email, contact3Data.phone);
        const response = await request(app).get("/users");
        expect(response.body).toHaveProperty("name")
        expect(response.body).toHaveProperty("contacts")
        expect(response.body.contacts).toHaveProperty("map")
        expect(response.body.contacts[0].phone).toBe(contact1Data.phone)
        expect(response.body.contacts[0].phone).toBe(contact1Data.email)
        expect(response.body.contacts[1].phone).toBe(contact2Data.phone)
        expect(response.body.contacts[1].phone).toBe(contact2Data.email)
        expect(response.body.contacts[2].phone).toBe(contact3Data.phone)
        expect(response.body.contacts[2].phone).toBe(contact3Data.email)
    })
})


describe("Teste de exclusão de contatos", () => {
    let connection: DataSource

    beforeAll(async () => {
        await AppDataSource.initialize().then((res) => {
            connection = res
        }).catch((err) => {
            console.error("Erro durante a inicialização do banco de dados", err)
        });
    })

    afterAll(async () => {
        await connection.destroy();
    })

    const invalidId = "a9aa99a9-999a-99a9-999a-9aa999aaaaaa"

    test("Testar excluir contatos para cliente com id inválido", async () => {
        const response = await request(app).delete(`/user/${invalidId}/contact`);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty("message")
        expect(response.body.message).toBe("Usuário não encontrado")
    })

    test("Testar excluir contato", async () => {
        await CreateUserService({ name: "Client teste 7" });
        const ListAllClients = await ListAllUsersService();
        const newClientId = ListAllClients[0];
        const response = await request(app).delete(`/user/${newClientId}/contact/${newClientId.contacts[0].id}}`);
        expect(response.status).toBe(204);
    })
})